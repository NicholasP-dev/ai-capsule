require("dotenv").config();

const express = require("express");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const path = require("path");
const db = require("./db");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cookieParser());

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 2 * 60 * 60 * 1000,
};

function authenticateToken(req, res, next) {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({
      error: "Unauthorized",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      error: "Unauthorized",
    });
  }
}

// ----------------------------------------------------
// PUBLIC API
// ----------------------------------------------------

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// ----------------------------------------------------
// AUTHENTICATION
// ----------------------------------------------------

app.get("/login", (req, res) => {
  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID,
    redirect_uri: process.env.GITHUB_CALLBACK_URL,
    scope: "read:user",
  });

  res.redirect(
    `https://github.com/login/oauth/authorize?${params.toString()}`
  );
});

app.get("/auth/github/callback", async (req, res) => {
  const code = req.query.code;

  if (!code) {
    return res
      .status(400)
      .send("GitHub did not provide an authorization code.");
  }

  try {
    const tokenResponse = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code,
          redirect_uri: process.env.GITHUB_CALLBACK_URL,
        }),
      }
    );

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      console.error("GitHub token error:", tokenData);

      return res.status(401).send("GitHub authentication failed.");
    }

    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "AI-Capsule",
      },
    });

    if (!userResponse.ok) {
      return res.status(401).send("Unable to retrieve GitHub user.");
    }

    const githubUser = await userResponse.json();

    const appToken = jwt.sign(
      {
        userId: String(githubUser.id),
        username: githubUser.login,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "2h",
      }
    );

    res.cookie("token", appToken, cookieOptions);

    if (process.env.NODE_ENV === "production") {
      res.redirect("/dashboard");
    } else {
      res.redirect(
        `${process.env.FRONTEND_URL || "http://localhost:5173"}/dashboard`
      );
    }
  } catch (error) {
    console.error("OAuth error:", error);

    res.status(500).send("OAuth login failed.");
  }
});

app.get("/api/auth/me", authenticateToken, (req, res) => {
  res.json({
    userId: req.user.userId,
    username: req.user.username,
  });
});

app.post("/api/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });

  res.json({
    message: "Logged out successfully",
  });
});

// ----------------------------------------------------
// CAPSULE CRUD
// ----------------------------------------------------

app.get("/api/capsules", authenticateToken, (req, res) => {
  const userId = req.user.userId;

  db.all(
    "SELECT * FROM capsules WHERE user_id = ? ORDER BY created_at DESC",
    [userId],
    (err, rows) => {
      if (err) {
        console.error(err.message);

        return res.status(500).json({
          error: "Failed to load capsules",
        });
      }

      res.json(rows);
    }
  );
});

app.post("/api/capsules", authenticateToken, (req, res) => {
  const userId = req.user.userId;

  const {
    project_name,
    prompt_title,
    prompt_version,
    prompt_text,
    response_summary,
    category,
    usefulness,
    reviewed,
    improved,
    screenshot_url,
    notes,
  } = req.body;

  if (!project_name || !prompt_title || !prompt_text) {
    return res.status(400).json({
      error: "Project name, prompt title and prompt text are required",
    });
  }

  const sql = `
    INSERT INTO capsules (
      user_id,
      project_name,
      prompt_title,
      prompt_version,
      prompt_text,
      response_summary,
      category,
      usefulness,
      reviewed,
      improved,
      screenshot_url,
      notes
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    userId,
    project_name,
    prompt_title,
    prompt_version || "",
    prompt_text,
    response_summary || "",
    category || "",
    usefulness || "",
    reviewed ? 1 : 0,
    improved ? 1 : 0,
    screenshot_url || "",
    notes || "",
  ];

  db.run(sql, values, function (err) {
    if (err) {
      console.error(err.message);

      return res.status(500).json({
        error: "Failed to create capsule",
      });
    }

    res.status(201).json({
      id: this.lastID,
      message: "Capsule created successfully",
    });
  });
});

app.put("/api/capsules/:id", authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const capsuleId = req.params.id;

  const {
    project_name,
    prompt_title,
    prompt_version,
    prompt_text,
    response_summary,
    category,
    usefulness,
    reviewed,
    improved,
    screenshot_url,
    notes,
  } = req.body;

  if (!project_name || !prompt_title || !prompt_text) {
    return res.status(400).json({
      error: "Project name, prompt title and prompt text are required",
    });
  }

  const sql = `
    UPDATE capsules
    SET
      project_name = ?,
      prompt_title = ?,
      prompt_version = ?,
      prompt_text = ?,
      response_summary = ?,
      category = ?,
      usefulness = ?,
      reviewed = ?,
      improved = ?,
      screenshot_url = ?,
      notes = ?
    WHERE id = ? AND user_id = ?
  `;

  const values = [
    project_name,
    prompt_title,
    prompt_version || "",
    prompt_text,
    response_summary || "",
    category || "",
    usefulness || "",
    reviewed ? 1 : 0,
    improved ? 1 : 0,
    screenshot_url || "",
    notes || "",
    capsuleId,
    userId,
  ];

  db.run(sql, values, function (err) {
    if (err) {
      console.error(err.message);

      return res.status(500).json({
        error: "Failed to update capsule",
      });
    }

    if (this.changes === 0) {
      return res.status(404).json({
        error: "Capsule not found",
      });
    }

    res.json({
      message: "Capsule updated successfully",
    });
  });
});

app.delete("/api/capsules/:id", authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const capsuleId = req.params.id;

  db.run(
    "DELETE FROM capsules WHERE id = ? AND user_id = ?",
    [capsuleId, userId],
    function (err) {
      if (err) {
        console.error(err.message);

        return res.status(500).json({
          error: "Failed to delete capsule",
        });
      }

      if (this.changes === 0) {
        return res.status(404).json({
          error: "Capsule not found",
        });
      }

      res.json({
        message: "Capsule deleted successfully",
      });
    }
  );
});

// ----------------------------------------------------
// REACT PRODUCTION FRONTEND
// ----------------------------------------------------

const clientDistPath = path.join(__dirname, "client", "dist");

app.use(express.static(clientDistPath));

app.use((req, res, next) => {
  if (
    req.method === "GET" &&
    !req.path.startsWith("/api/") &&
    !req.path.startsWith("/auth/") &&
    req.path !== "/login"
  ) {
    return res.sendFile(path.join(clientDistPath, "index.html"));
  }

  next();
});

// ----------------------------------------------------

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});