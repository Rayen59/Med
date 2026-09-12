import express, { Request, Response } from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { AppDatabase, User, Post, SpaceFolder, Forum, ForumMessage, Quiz, QuizSubmission, Poll, AppNotification, PostComment } from "./src/types";

const app = express();
const PORT = 3000;

// High body limits for media uploads (audio, video, documents, images)
app.use(express.json({ limit: "60mb" }));
app.use(express.urlencoded({ limit: "60mb", extended: true }));

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

// Ensure clean database without any mock/dummy data as explicitly requested
function initDatabase(): AppDatabase {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const blankDb: AppDatabase = {
    users: [],
    posts: [],
    spaces: [],
    forums: [],
    forumMessages: [],
    quizzes: [],
    quizSubmissions: [],
    polls: [],
    notifications: []
  };

  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(blankDb, null, 2), "utf-8");
    return blankDb;
  }

  try {
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    return {
      users: parsed.users || [],
      posts: parsed.posts || [],
      spaces: parsed.spaces || [],
      forums: parsed.forums || [],
      forumMessages: parsed.forumMessages || [],
      quizzes: parsed.quizzes || [],
      quizSubmissions: parsed.quizSubmissions || [],
      polls: parsed.polls || [],
      notifications: parsed.notifications || []
    };
  } catch (err) {
    console.error("Error reading db.json, reinitializing blank db", err);
    fs.writeFileSync(DB_FILE, JSON.stringify(blankDb, null, 2), "utf-8");
    return blankDb;
  }
}

let db: AppDatabase = initDatabase();

function saveDatabase() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to save database to disk:", err);
  }
}

// Server-Sent Events (SSE) clients for instantaneous real-time broadcasting
let sseClients: Response[] = [];

function broadcast(event: string, payload: any) {
  const data = JSON.stringify({ event, payload, timestamp: new Date().toISOString() });
  sseClients.forEach((client) => {
    client.write(`event: update\ndata: ${data}\n\n`);
  });
}

// Helper to create and broadcast user-targeted notifications
function sendNotification(params: {
  recipientId: string;
  actor: User;
  type: 'post_like' | 'post_comment' | 'comment_reply' | 'poll_vote' | 'quiz_submission';
  title: string;
  message: string;
  targetId: string;
  targetType: 'post' | 'poll' | 'quiz' | 'forum';
}) {
  if (!params.recipientId || params.recipientId === params.actor.id) return;

  const notif: AppNotification = {
    id: "notif_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
    recipientId: params.recipientId,
    actorId: params.actor.id,
    actorName: `${params.actor.prenom} ${params.actor.nom}`,
    actorAvatar: params.actor.avatarUrl,
    actorPromo: params.actor.promo,
    type: params.type,
    title: params.title,
    message: params.message,
    targetId: params.targetId,
    targetType: params.targetType,
    isRead: false,
    createdAt: new Date().toISOString()
  };

  db.notifications = db.notifications || [];
  db.notifications.unshift(notif);
  if (db.notifications.length > 300) {
    db.notifications = db.notifications.slice(0, 300);
  }
  saveDatabase();
  broadcast("NEW_NOTIFICATION", notif);
}

// Secret Administration credentials
const ADMIN_EMAIL = "admin189@gmail.com";
const ADMIN_PASSWORD = "sfaxmed981";

function ensureAdminUser() {
  const existingAdmin = db.users.find((u) => u.email.toLowerCase() === ADMIN_EMAIL);
  if (!existingAdmin) {
    const adminUser: User = {
      id: "usr_admin_sfax_official",
      nom: "Direction",
      prenom: "Administration FMS",
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=admin189&backgroundColor=0f766e",
      promo: "Administration & Décanat",
      bio: "Compte d'administration officiel et de modération - Faculté de Médecine de Sfax",
      role: "admin",
      createdAt: new Date().toISOString()
    };
    db.users.unshift(adminUser);
    saveDatabase();
  } else {
    existingAdmin.role = "admin";
    existingAdmin.password = ADMIN_PASSWORD;
  }
}
ensureAdminUser();

// Helper to check and expire user ban status
function checkUserBanStatus(user: User): { isBanned: boolean; message?: string } {
  if (!user.isBanned) return { isBanned: false };
  if (user.banUntil === "permanent") {
    return {
      isBanned: true,
      message: "Votre compte a été banni définitivement par l'administration de la Faculté de Médecine de Sfax."
    };
  }
  if (user.banUntil) {
    const banTime = new Date(user.banUntil).getTime();
    if (banTime > Date.now()) {
      return {
        isBanned: true,
        message: `Votre compte est temporairement suspendu par l'administration jusqu'au ${new Date(user.banUntil).toLocaleString("fr-FR")}.`
      };
    } else {
      // Ban has expired!
      user.isBanned = false;
      user.banUntil = null;
      user.banDuration = null;
      user.banReason = undefined;
      saveDatabase();
      return { isBanned: false };
    }
  }
  return { isBanned: true, message: "Votre compte est suspendu par l'administration." };
}

// SSE live endpoint
app.get("/api/live", (req: Request, res: Response) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive"
  });
  res.write("\n");
  sseClients.push(res);

  req.on("close", () => {
    sseClients = sseClients.filter((c) => c !== res);
  });
});

// ======================== AUTHENTICATION ========================

// Inscription (Create account) - strictly unique email
app.post("/api/auth/register", (req: Request, res: Response) => {
  const { nom, prenom, email, password, avatarUrl, promo, bio } = req.body;

  if (!nom || !prenom || !email || !password) {
    res.status(400).json({ error: "Tous les champs obligatoires doivent être remplis." });
    return;
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  // Check unique email requirement
  const existingUser = db.users.find((u) => u.email.toLowerCase() === normalizedEmail);
  if (existingUser) {
    res.status(409).json({ error: "Cet email est déjà utilisé. Veuillez utiliser un autre email ou vous connecter." });
    return;
  }

  const newUser: User = {
    id: "usr_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
    nom: String(nom).trim(),
    prenom: String(prenom).trim(),
    email: normalizedEmail,
    password: String(password),
    avatarUrl: avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(prenom + " " + nom)}&backgroundColor=0f766e,0284c7`,
    promo: promo || "PCEM1",
    bio: bio || "",
    createdAt: new Date().toISOString()
  };

  db.users.push(newUser);
  saveDatabase();

  const { password: _, ...safeUser } = newUser;
  res.status(201).json({ user: safeUser, token: newUser.id });
});

// Connexion (Login)
app.post("/api/auth/login", (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: "Veuillez renseigner votre email et votre mot de passe." });
    return;
  }

  const normalizedEmail = String(email).trim().toLowerCase();

  // If secret admin credentials used, ensure admin exists
  if (normalizedEmail === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    ensureAdminUser();
  }

  const user = db.users.find(
    (u) => u.email.toLowerCase() === normalizedEmail && u.password === String(password)
  );

  if (!user) {
    res.status(401).json({ error: "Email ou mot de passe incorrect." });
    return;
  }

  // Check ban status
  const banStatus = checkUserBanStatus(user);
  if (banStatus.isBanned) {
    res.status(403).json({ error: banStatus.message });
    return;
  }

  const { password: _, ...safeUser } = user;
  res.json({ user: safeUser, token: user.id });
});

// Current user profile
app.get("/api/auth/me", (req: Request, res: Response) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) {
    res.status(401).json({ error: "Non authentifié" });
    return;
  }

  const user = db.users.find((u) => u.id === token);
  if (!user) {
    res.status(404).json({ error: "Utilisateur non trouvé" });
    return;
  }

  // Check ban status
  const banStatus = checkUserBanStatus(user);
  if (banStatus.isBanned) {
    res.status(403).json({ error: banStatus.message, isBanned: true });
    return;
  }

  const { password: _, ...safeUser } = user;
  res.json({ user: safeUser });
});

// Update profile
app.put("/api/auth/profile", (req: Request, res: Response) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  const user = db.users.find((u) => u.id === token);
  if (!user) {
    res.status(401).json({ error: "Non autorisé" });
    return;
  }

  const { nom, prenom, avatarUrl, promo, bio } = req.body;
  if (nom) user.nom = nom;
  if (prenom) user.prenom = prenom;
  if (avatarUrl) user.avatarUrl = avatarUrl;
  if (promo) user.promo = promo;
  if (bio !== undefined) user.bio = bio;

  saveDatabase();
  const { password: _, ...safeUser } = user;
  res.json({ user: safeUser });
});

// ======================== PUBLICATIONS / FEED ========================

// Get all posts (newest first)
app.get("/api/posts", (_req: Request, res: Response) => {
  const sorted = [...db.posts].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  res.json({ posts: sorted });
});

// Create new post (instant broadcast to all users)
app.post("/api/posts", (req: Request, res: Response) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  const user = db.users.find((u) => u.id === token);
  if (!user) {
    res.status(401).json({ error: "Vous devez être connecté pour publier." });
    return;
  }

  const banCheck = checkUserBanStatus(user);
  if (banCheck.isBanned) {
    res.status(403).json({ error: banCheck.message });
    return;
  }

  if (user.isRestricted) {
    res.status(403).json({
      error: "Vos interactions sont limitées en mode lecture seule par l'administration. Vous ne pouvez pas publier."
    });
    return;
  }

  const { content, attachments, tags } = req.body;
  if (!content && (!attachments || attachments.length === 0)) {
    res.status(400).json({ error: "Le contenu de la publication ou une pièce jointe est requis." });
    return;
  }

  const newPost: Post = {
    id: "post_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
    authorId: user.id,
    authorName: `${user.prenom} ${user.nom}`,
    authorAvatar: user.avatarUrl,
    authorPromo: user.promo,
    content: content || "",
    attachments: attachments || [],
    tags: tags || [],
    likes: [],
    comments: [],
    createdAt: new Date().toISOString()
  };

  db.posts.unshift(newPost);
  saveDatabase();

  // Instant real-time broadcast to all connected students
  broadcast("NEW_POST", newPost);
  res.status(201).json({ post: newPost });
});

// Edit post (author or admin)
app.put("/api/posts/:id", (req: Request, res: Response) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  const user = db.users.find((u) => u.id === token);
  const postIndex = db.posts.findIndex((p) => p.id === req.params.id);

  if (postIndex === -1) {
    res.status(404).json({ error: "Publication non trouvée." });
    return;
  }

  const post = db.posts[postIndex];
  if (!user || (post.authorId !== user.id && user.role !== "admin")) {
    res.status(403).json({ error: "Seul l'auteur ou un administrateur peut modifier cette publication." });
    return;
  }

  if (user.isRestricted && user.role !== "admin") {
    res.status(403).json({ error: "Vos interactions sont limitées en mode lecture seule." });
    return;
  }

  const { content, attachments, tags } = req.body;
  if (content !== undefined) post.content = content;
  if (attachments !== undefined) post.attachments = attachments;
  if (tags !== undefined) post.tags = tags;
  post.updatedAt = new Date().toISOString();

  saveDatabase();
  broadcast("UPDATE_POST", post);
  res.json({ post });
});

// Delete post (author or admin)
app.delete("/api/posts/:id", (req: Request, res: Response) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  const user = db.users.find((u) => u.id === token);
  const postIndex = db.posts.findIndex((p) => p.id === req.params.id);

  if (postIndex === -1) {
    res.status(404).json({ error: "Publication non trouvée." });
    return;
  }

  const post = db.posts[postIndex];
  if (!user || (post.authorId !== user.id && user.role !== "admin")) {
    res.status(403).json({ error: "Seul l'auteur ou un administrateur peut supprimer cette publication." });
    return;
  }

  const postId = post.id;
  db.posts.splice(postIndex, 1);

  // Also remove from any spaces
  db.spaces.forEach((s) => {
    s.postIds = s.postIds.filter((id) => id !== postId);
  });

  saveDatabase();
  broadcast("DELETE_POST", { id: postId });
  res.json({ success: true, id: postId });
});

// Like / Unlike post
app.post("/api/posts/:id/like", (req: Request, res: Response) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  const user = db.users.find((u) => u.id === token);
  if (!user) {
    res.status(401).json({ error: "Connectez-vous pour aimer ce contenu." });
    return;
  }

  if (user.isRestricted) {
    res.status(403).json({ error: "Votre compte est en mode lecture seule." });
    return;
  }

  const post = db.posts.find((p) => p.id === req.params.id);
  if (!post) {
    res.status(404).json({ error: "Publication non trouvée." });
    return;
  }

  const index = post.likes.indexOf(user.id);
  if (index > -1) {
    post.likes.splice(index, 1);
  } else {
    post.likes.push(user.id);
    if (post.authorId !== user.id) {
      sendNotification({
        recipientId: post.authorId,
        actor: user,
        type: 'post_like',
        title: 'Nouvelle réaction',
        message: `${user.prenom} ${user.nom} (${user.promo}) a aimé votre publication.`,
        targetId: post.id,
        targetType: 'post'
      });
    }
  }

  saveDatabase();
  broadcast("LIKE_POST", { postId: post.id, likes: post.likes });
  res.json({ likes: post.likes });
});

// Add comment or reply to post
app.post("/api/posts/:id/comment", (req: Request, res: Response) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  const user = db.users.find((u) => u.id === token);
  if (!user) {
    res.status(401).json({ error: "Connectez-vous pour commenter." });
    return;
  }

  if (user.isRestricted) {
    res.status(403).json({
      error: "Vos interactions sont limitées en mode lecture seule par l'administration. Vous ne pouvez pas commenter."
    });
    return;
  }

  const { content, parentId } = req.body;
  if (!content || !content.trim()) {
    res.status(400).json({ error: "Le commentaire ne peut pas être vide." });
    return;
  }

  const post = db.posts.find((p) => p.id === req.params.id);
  if (!post) {
    res.status(404).json({ error: "Publication non trouvée." });
    return;
  }

  let replyToUserName: string | undefined = undefined;
  let parentComment: PostComment | undefined = undefined;

  if (parentId) {
    parentComment = (post.comments || []).find((c) => c.id === parentId);
    if (parentComment) {
      replyToUserName = parentComment.userName;
    }
  }

  const newComment: PostComment = {
    id: "com_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
    userId: user.id,
    userName: `${user.prenom} ${user.nom}`,
    userAvatar: user.avatarUrl,
    userPromo: user.promo,
    content: content.trim(),
    createdAt: new Date().toISOString(),
    parentId: parentId || undefined,
    replyToUserName
  };

  if (!post.comments) post.comments = [];
  post.comments.push(newComment);

  if (parentComment) {
    parentComment.replies = parentComment.replies || [];
    parentComment.replies.push(newComment);
  }

  saveDatabase();
  broadcast("COMMENT_POST", { postId: post.id, comment: newComment });

  // Notifications logic
  if (parentComment && parentComment.userId !== user.id) {
    // Notify author of the parent comment
    sendNotification({
      recipientId: parentComment.userId,
      actor: user,
      type: 'comment_reply',
      title: 'Réponse à votre commentaire',
      message: `${user.prenom} ${user.nom} a répondu à votre commentaire : "${content.trim().slice(0, 45)}..."`,
      targetId: post.id,
      targetType: 'post'
    });
  }

  // Also notify post author if they are not the commenter and not the parent comment author
  if (post.authorId !== user.id && (!parentComment || post.authorId !== parentComment.userId)) {
    sendNotification({
      recipientId: post.authorId,
      actor: user,
      type: 'post_comment',
      title: 'Nouveau commentaire',
      message: `${user.prenom} ${user.nom} a commenté votre publication : "${content.trim().slice(0, 45)}..."`,
      targetId: post.id,
      targetType: 'post'
    });
  }

  res.status(201).json({ comment: newComment, comments: post.comments });
});

// ======================== ESPACES PERSONNELS / DOSSIERS ========================

// Get user spaces
app.get("/api/spaces", (req: Request, res: Response) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) {
    res.status(401).json({ error: "Non autorisé" });
    return;
  }

  const userSpaces = db.spaces.filter((s) => s.userId === token);
  res.json({ spaces: userSpaces });
});

// Create space / dossier
app.post("/api/spaces", (req: Request, res: Response) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  const user = db.users.find((u) => u.id === token);
  if (!user) {
    res.status(401).json({ error: "Non autorisé" });
    return;
  }

  const { name, category, description, color } = req.body;
  if (!name) {
    res.status(400).json({ error: "Le nom de l'espace est requis." });
    return;
  }

  const newSpace: SpaceFolder = {
    id: "spc_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
    userId: user.id,
    name: name.trim(),
    category: category ? category.trim() : "Général",
    description: description || "",
    color: color || "#0d9488",
    postIds: [],
    createdAt: new Date().toISOString()
  };

  db.spaces.push(newSpace);
  saveDatabase();
  res.status(201).json({ space: newSpace });
});

// Edit space
app.put("/api/spaces/:id", (req: Request, res: Response) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  const space = db.spaces.find((s) => s.id === req.params.id && s.userId === token);
  if (!space) {
    res.status(404).json({ error: "Espace non trouvé." });
    return;
  }

  const { name, category, description, color } = req.body;
  if (name) space.name = name.trim();
  if (category) space.category = category.trim();
  if (description !== undefined) space.description = description;
  if (color) space.color = color;

  saveDatabase();
  res.json({ space });
});

// Delete space
app.delete("/api/spaces/:id", (req: Request, res: Response) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  const index = db.spaces.findIndex((s) => s.id === req.params.id && s.userId === token);
  if (index === -1) {
    res.status(404).json({ error: "Espace non trouvé." });
    return;
  }

  db.spaces.splice(index, 1);
  saveDatabase();
  res.json({ success: true });
});

// Add post to space
app.post("/api/spaces/:id/add-post", (req: Request, res: Response) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  const space = db.spaces.find((s) => s.id === req.params.id && s.userId === token);
  if (!space) {
    res.status(404).json({ error: "Espace non trouvé." });
    return;
  }

  const { postId } = req.body;
  if (!postId) {
    res.status(400).json({ error: "ID de la publication requis." });
    return;
  }

  if (!space.postIds.includes(postId)) {
    space.postIds.push(postId);
    saveDatabase();
  }

  res.json({ space });
});

// Remove post from space
app.delete("/api/spaces/:id/remove-post/:postId", (req: Request, res: Response) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  const space = db.spaces.find((s) => s.id === req.params.id && s.userId === token);
  if (!space) {
    res.status(404).json({ error: "Espace non trouvé." });
    return;
  }

  space.postIds = space.postIds.filter((id) => id !== req.params.postId);
  saveDatabase();
  res.json({ space });
});

// ======================== FORUMS (PUBLICS & PRIVÉS AVEC CODE) ========================

// Get forums list (hiding access codes)
app.get("/api/forums", (_req: Request, res: Response) => {
  const sanitized = db.forums.map((f) => {
    const { accessCode: _, ...safe } = f;
    return { ...safe, hasCode: f.isPrivate };
  });
  res.json({ forums: sanitized });
});

// Create forum
app.post("/api/forums", (req: Request, res: Response) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  const user = db.users.find((u) => u.id === token);
  if (!user) {
    res.status(401).json({ error: "Connectez-vous pour créer un forum." });
    return;
  }

  const { title, description, category, isPrivate, accessCode } = req.body;
  if (!title) {
    res.status(400).json({ error: "Le titre du forum est obligatoire." });
    return;
  }

  if (isPrivate && (!accessCode || !accessCode.trim())) {
    res.status(400).json({ error: "Un code d'accès est requis pour un forum privé." });
    return;
  }

  const newForum: Forum = {
    id: "frm_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
    title: title.trim(),
    description: description ? description.trim() : "",
    category: category ? category.trim() : "Général",
    isPrivate: Boolean(isPrivate),
    accessCode: isPrivate ? accessCode.trim() : undefined,
    creatorId: user.id,
    creatorName: `${user.prenom} ${user.nom}`,
    creatorAvatar: user.avatarUrl,
    membersCount: 1,
    messagesCount: 0,
    createdAt: new Date().toISOString()
  };

  db.forums.unshift(newForum);
  saveDatabase();

  broadcast("NEW_FORUM", { ...newForum, accessCode: undefined, hasCode: newForum.isPrivate });
  res.status(201).json({ forum: newForum });
});

// Verify access code for private forum
app.post("/api/forums/:id/verify", (req: Request, res: Response) => {
  const forum = db.forums.find((f) => f.id === req.params.id);
  if (!forum) {
    res.status(404).json({ error: "Forum introuvable." });
    return;
  }

  if (!forum.isPrivate) {
    res.json({ authorized: true });
    return;
  }

  const { code } = req.body;
  if (code && code.trim() === forum.accessCode) {
    res.json({ authorized: true });
  } else {
    res.status(403).json({ authorized: false, error: "Code d'accès incorrect." });
  }
});

// Get forum messages
app.get("/api/forums/:id/messages", (req: Request, res: Response) => {
  const messages = db.forumMessages
    .filter((m) => m.forumId === req.params.id)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  res.json({ messages });
});

// Send message to forum
app.post("/api/forums/:id/messages", (req: Request, res: Response) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  const user = db.users.find((u) => u.id === token);
  if (!user) {
    res.status(401).json({ error: "Connectez-vous pour participer au forum." });
    return;
  }

  const forum = db.forums.find((f) => f.id === req.params.id);
  if (!forum) {
    res.status(404).json({ error: "Forum non trouvé." });
    return;
  }

  const { content } = req.body;
  if (!content || !content.trim()) {
    res.status(400).json({ error: "Le message ne peut pas être vide." });
    return;
  }

  const newMessage: ForumMessage = {
    id: "msg_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
    forumId: forum.id,
    userId: user.id,
    userName: `${user.prenom} ${user.nom}`,
    userAvatar: user.avatarUrl,
    userPromo: user.promo,
    content: content.trim(),
    createdAt: new Date().toISOString()
  };

  db.forumMessages.push(newMessage);
  forum.messagesCount = (forum.messagesCount || 0) + 1;
  saveDatabase();

  broadcast("FORUM_MESSAGE", newMessage);
  res.status(201).json({ message: newMessage });
});

// ======================== QUIZ / QCM AVEC CLASSEMENT ========================

// Get quizzes list
app.get("/api/quizzes", (_req: Request, res: Response) => {
  // Hide answers when listing quizzes
  const list = db.quizzes.map((q) => {
    return {
      ...q,
      questions: q.questions.map((qu) => ({
        ...qu,
        options: qu.options.map((o) => ({ id: o.id, text: o.text })),
        explanation: undefined
      }))
    };
  });
  res.json({ quizzes: list });
});

// Create quiz (with designated correct answers and points)
app.post("/api/quizzes", (req: Request, res: Response) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  const user = db.users.find((u) => u.id === token);
  if (!user) {
    res.status(401).json({ error: "Connectez-vous pour créer un quiz." });
    return;
  }

  const { title, description, subject, questions } = req.body;
  if (!title || !questions || !Array.isArray(questions) || questions.length === 0) {
    res.status(400).json({ error: "Le quiz doit comporter un titre et au moins une question." });
    return;
  }

  // Calculate total points
  const totalPoints = questions.reduce((sum, q) => sum + (Number(q.points) || 1), 0);

  const newQuiz: Quiz = {
    id: "qz_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
    title: title.trim(),
    description: description ? description.trim() : "",
    subject: subject ? subject.trim() : "Médecine Générale",
    authorId: user.id,
    authorName: `${user.prenom} ${user.nom}`,
    authorAvatar: user.avatarUrl,
    questions,
    totalPoints,
    submissionsCount: 0,
    createdAt: new Date().toISOString()
  };

  db.quizzes.unshift(newQuiz);
  saveDatabase();

  broadcast("NEW_QUIZ", { ...newQuiz, questions: newQuiz.questions.length });
  res.status(201).json({ quiz: newQuiz });
});

// Submit quiz answers & calculate score
app.post("/api/quizzes/:id/submit", (req: Request, res: Response) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  const user = db.users.find((u) => u.id === token);
  if (!user) {
    res.status(401).json({ error: "Connectez-vous pour passer le quiz." });
    return;
  }

  const quiz = db.quizzes.find((q) => q.id === req.params.id);
  if (!quiz) {
    res.status(404).json({ error: "Quiz introuvable." });
    return;
  }

  const { answers } = req.body; // map: questionId -> array of selected optionIds
  if (!answers) {
    res.status(400).json({ error: "Réponses non fournies." });
    return;
  }

  let totalScore = 0;
  const detailedCorrections = quiz.questions.map((question) => {
    const userSelected = answers[question.id] || [];
    const correctOptions = question.options.filter((o) => o.isCorrect).map((o) => o.id);

    // Exact match for full points (ECN / QCM standard)
    const isCorrect =
      userSelected.length === correctOptions.length &&
      userSelected.every((optId: string) => correctOptions.includes(optId));

    const earnedPoints = isCorrect ? Number(question.points || 1) : 0;
    totalScore += earnedPoints;

    return {
      questionId: question.id,
      question: question.question,
      options: question.options,
      userSelected,
      correctOptions,
      isCorrect,
      explanation: question.explanation,
      earnedPoints,
      maxPoints: Number(question.points || 1)
    };
  });

  const percentage = quiz.totalPoints > 0 ? Math.round((totalScore / quiz.totalPoints) * 100) : 0;

  // Record submission (update if user already submitted)
  const existingSubIndex = db.quizSubmissions.findIndex(
    (s) => s.quizId === quiz.id && s.userId === user.id
  );

  const submission: QuizSubmission = {
    id: existingSubIndex > -1 ? db.quizSubmissions[existingSubIndex].id : "sub_" + Date.now(),
    quizId: quiz.id,
    userId: user.id,
    userName: `${user.prenom} ${user.nom}`,
    userAvatar: user.avatarUrl,
    userPromo: user.promo,
    score: totalScore,
    totalPoints: quiz.totalPoints,
    percentage,
    submittedAt: new Date().toISOString()
  };

  if (existingSubIndex > -1) {
    // Only update if better or recent
    db.quizSubmissions[existingSubIndex] = submission;
  } else {
    db.quizSubmissions.push(submission);
    quiz.submissionsCount = (quiz.submissionsCount || 0) + 1;
  }

  saveDatabase();
  broadcast("QUIZ_SUBMITTED", { quizId: quiz.id, submission });

  if (quiz.authorId !== user.id) {
    sendNotification({
      recipientId: quiz.authorId,
      actor: user,
      type: 'quiz_submission',
      title: 'Participation au Quiz QCM',
      message: `${user.prenom} ${user.nom} (${user.promo}) a passé votre quiz "${quiz.title}" (Score : ${percentage}%).`,
      targetId: quiz.id,
      targetType: 'quiz'
    });
  }

  res.json({
    score: totalScore,
    totalPoints: quiz.totalPoints,
    percentage,
    corrections: detailedCorrections
  });
});

// Get quiz leaderboard (rankings by score descending)
app.get("/api/quizzes/:id/leaderboard", (req: Request, res: Response) => {
  const submissions = db.quizSubmissions
    .filter((s) => s.quizId === req.params.id)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
    })
    .map((sub, index) => ({
      ...sub,
      rank: index + 1
    }));

  res.json({ leaderboard: submissions });
});

// Overall leaderboard across all quizzes
app.get("/api/leaderboard/global", (_req: Request, res: Response) => {
  const studentScores: Record<string, { user: { id: string; name: string; avatar: string; promo: string }; totalScore: number; totalPossible: number; quizzesCount: number }> = {};

  db.quizSubmissions.forEach((sub) => {
    if (!studentScores[sub.userId]) {
      studentScores[sub.userId] = {
        user: { id: sub.userId, name: sub.userName, avatar: sub.userAvatar, promo: sub.userPromo },
        totalScore: 0,
        totalPossible: 0,
        quizzesCount: 0
      };
    }
    studentScores[sub.userId].totalScore += sub.score;
    studentScores[sub.userId].totalPossible += sub.totalPoints;
    studentScores[sub.userId].quizzesCount += 1;
  });

  const ranked = Object.values(studentScores)
    .sort((a, b) => b.totalScore - a.totalScore)
    .map((item, index) => ({
      rank: index + 1,
      ...item,
      averagePercentage: item.totalPossible > 0 ? Math.round((item.totalScore / item.totalPossible) * 100) : 0
    }));

  res.json({ leaderboard: ranked });
});

// ======================== SONDAGES (POLLS) ========================

// Get all polls
app.get("/api/polls", (_req: Request, res: Response) => {
  const sorted = [...db.polls].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  res.json({ polls: sorted });
});

// Create poll
app.post("/api/polls", (req: Request, res: Response) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  const user = db.users.find((u) => u.id === token);
  if (!user) {
    res.status(401).json({ error: "Connectez-vous pour créer un sondage." });
    return;
  }

  const { question, description, options } = req.body;
  if (!question || !options || !Array.isArray(options) || options.length < 2) {
    res.status(400).json({ error: "Le sondage doit comporter une question et au moins 2 options." });
    return;
  }

  const newPoll: Poll = {
    id: "pll_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
    question: question.trim(),
    description: description ? description.trim() : "",
    authorId: user.id,
    authorName: `${user.prenom} ${user.nom}`,
    authorAvatar: user.avatarUrl,
    options: options.map((optText: string, i: number) => ({
      id: "opt_" + i + "_" + Math.random().toString(36).substring(2, 5),
      text: String(optText).trim(),
      votes: []
    })),
    createdAt: new Date().toISOString()
  };

  db.polls.unshift(newPoll);
  saveDatabase();

  broadcast("NEW_POLL", newPoll);
  res.status(201).json({ poll: newPoll });
});

// Vote in poll
app.post("/api/polls/:id/vote", (req: Request, res: Response) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  const user = db.users.find((u) => u.id === token);
  if (!user) {
    res.status(401).json({ error: "Connectez-vous pour voter." });
    return;
  }

  const poll = db.polls.find((p) => p.id === req.params.id);
  if (!poll) {
    res.status(404).json({ error: "Sondage introuvable." });
    return;
  }

  const { optionId } = req.body;
  if (!optionId) {
    res.status(400).json({ error: "Option de vote manquante." });
    return;
  }

  // Remove existing vote of this user from any other option in this poll
  poll.options.forEach((opt) => {
    opt.votes = opt.votes.filter((uid) => uid !== user.id);
  });

  // Add vote to chosen option
  const targetOption = poll.options.find((opt) => opt.id === optionId);
  if (targetOption) {
    targetOption.votes.push(user.id);
  }

  saveDatabase();
  broadcast("POLL_VOTED", poll);

  if (poll.authorId !== user.id) {
    sendNotification({
      recipientId: poll.authorId,
      actor: user,
      type: 'poll_vote',
      title: 'Vote au sondage',
      message: `${user.prenom} ${user.nom} (${user.promo}) a voté à votre sondage : "${poll.question.slice(0, 45)}..."`,
      targetId: poll.id,
      targetType: 'poll'
    });
  }

  res.json({ poll });
});

// ======================== NOTIFICATIONS ENDPOINTS ========================

// Get notifications for current user
app.get("/api/notifications", (req: Request, res: Response) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) {
    res.status(401).json({ error: "Non autorisé" });
    return;
  }
  const userNotifs = (db.notifications || [])
    .filter((n) => n.recipientId === token)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json({ notifications: userNotifs });
});

// Mark single notification as read
app.post("/api/notifications/:id/read", (req: Request, res: Response) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) {
    res.status(401).json({ error: "Non autorisé" });
    return;
  }
  const notif = (db.notifications || []).find((n) => n.id === req.params.id && n.recipientId === token);
  if (notif) {
    notif.isRead = true;
    saveDatabase();
  }
  res.json({ success: true });
});

// Mark all notifications as read
app.post("/api/notifications/read-all", (req: Request, res: Response) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) {
    res.status(401).json({ error: "Non autorisé" });
    return;
  }
  (db.notifications || []).forEach((n) => {
    if (n.recipientId === token) {
      n.isRead = true;
    }
  });
  saveDatabase();
  res.json({ success: true });
});

// Clear all notifications for user
app.delete("/api/notifications", (req: Request, res: Response) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) {
    res.status(401).json({ error: "Non autorisé" });
    return;
  }
  db.notifications = (db.notifications || []).filter((n) => n.recipientId !== token);
  saveDatabase();
  res.json({ success: true });
});

// Trigger a test notification for the user to verify the notification center and push toast
app.post("/api/notifications/test", (req: Request, res: Response) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  const user = db.users.find((u) => u.id === token);
  if (!user) {
    res.status(401).json({ error: "Non autorisé" });
    return;
  }

  const testNotif: AppNotification = {
    id: "notif_test_" + Date.now() + "_" + Math.random().toString(36).substring(2, 5),
    recipientId: user.id,
    actorId: "usr_fms_notif_bot",
    actorName: "Dr. Ben Salem (CHU Hédi Chaker)",
    actorAvatar: "https://api.dicebear.com/7.x/initials/svg?seed=BS&backgroundColor=0f766e",
    actorPromo: "Enseignant Hospitalo-Universitaire",
    type: "post_comment",
    title: "Commentaire clinique sur votre partage",
    message: "Excellente synthèse sémiologique ! Document très utile pour les stages hospitaliers.",
    targetId: "",
    targetType: "post",
    isRead: false,
    createdAt: new Date().toISOString()
  };

  db.notifications = db.notifications || [];
  db.notifications.unshift(testNotif);
  saveDatabase();
  broadcast("NEW_NOTIFICATION", testNotif);
  res.json({ notification: testNotif });
});

// ======================== ADMINISTRATION ENDPOINTS ========================

// Get all users with stats (Admin only)
app.get("/api/admin/users", (req: Request, res: Response) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  const user = db.users.find((u) => u.id === token);
  if (!user || user.role !== "admin") {
    res.status(403).json({ error: "Accès refusé. Espace réservé à l'administration FMS." });
    return;
  }

  // Refresh expired bans
  db.users.forEach((u) => checkUserBanStatus(u));

  const usersWithMeta = db.users.map((u) => {
    const { password: _, ...safeUser } = u;
    const postsCount = db.posts.filter((p) => p.authorId === u.id).length;
    return {
      ...safeUser,
      postsCount
    };
  });

  res.json({ users: usersWithMeta });
});

// Ban user (1 day, 3 days, 14 days, permanent)
app.post("/api/admin/users/:id/ban", (req: Request, res: Response) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  const admin = db.users.find((u) => u.id === token);
  if (!admin || admin.role !== "admin") {
    res.status(403).json({ error: "Accès refusé." });
    return;
  }

  const targetUser = db.users.find((u) => u.id === req.params.id);
  if (!targetUser) {
    res.status(404).json({ error: "Utilisateur non trouvé." });
    return;
  }

  if (targetUser.role === "admin") {
    res.status(400).json({ error: "Impossible de bannir un compte administrateur." });
    return;
  }

  const { duration, reason } = req.body;
  targetUser.isBanned = true;
  targetUser.banDuration = duration;
  targetUser.banReason = reason || "Infraction au règlement de la Faculté de Médecine de Sfax";

  const now = Date.now();
  if (duration === "1d") {
    targetUser.banUntil = new Date(now + 24 * 60 * 60 * 1000).toISOString();
  } else if (duration === "3d") {
    targetUser.banUntil = new Date(now + 3 * 24 * 60 * 60 * 1000).toISOString();
  } else if (duration === "14d") {
    targetUser.banUntil = new Date(now + 14 * 24 * 60 * 60 * 1000).toISOString();
  } else {
    targetUser.banUntil = "permanent";
  }

  saveDatabase();
  broadcast("USER_STATUS_CHANGED", {
    userId: targetUser.id,
    isBanned: true,
    banUntil: targetUser.banUntil,
    banDuration: targetUser.banDuration
  });

  const { password: _, ...safe } = targetUser;
  res.json({ user: safe, message: `Utilisateur banni avec succès (${duration}).` });
});

// Unban user
app.post("/api/admin/users/:id/unban", (req: Request, res: Response) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  const admin = db.users.find((u) => u.id === token);
  if (!admin || admin.role !== "admin") {
    res.status(403).json({ error: "Accès refusé." });
    return;
  }

  const targetUser = db.users.find((u) => u.id === req.params.id);
  if (!targetUser) {
    res.status(404).json({ error: "Utilisateur non trouvé." });
    return;
  }

  targetUser.isBanned = false;
  targetUser.banUntil = null;
  targetUser.banDuration = null;
  targetUser.banReason = undefined;

  saveDatabase();
  broadcast("USER_STATUS_CHANGED", { userId: targetUser.id, isBanned: false });

  const { password: _, ...safe } = targetUser;
  res.json({ user: safe, message: "Utilisateur réactivé / débanni avec succès." });
});

// Restrict user interactions (can only view, cannot post or comment)
app.post("/api/admin/users/:id/restrict", (req: Request, res: Response) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  const admin = db.users.find((u) => u.id === token);
  if (!admin || admin.role !== "admin") {
    res.status(403).json({ error: "Accès refusé." });
    return;
  }

  const targetUser = db.users.find((u) => u.id === req.params.id);
  if (!targetUser) {
    res.status(404).json({ error: "Utilisateur non trouvé." });
    return;
  }

  if (targetUser.role === "admin") {
    res.status(400).json({ error: "Impossible de restreindre un administrateur." });
    return;
  }

  const { isRestricted, reason } = req.body;
  targetUser.isRestricted = Boolean(isRestricted);
  targetUser.restrictionReason = reason || (isRestricted ? "Interactions limitées par l'administration (lecture seule)" : undefined);

  saveDatabase();
  broadcast("USER_STATUS_CHANGED", { userId: targetUser.id, isRestricted: targetUser.isRestricted });

  const { password: _, ...safe } = targetUser;
  res.json({
    user: safe,
    message: isRestricted
      ? "Interactions de l'utilisateur limitées : mode lecture seule activé."
      : "Restrictions levées : l'utilisateur peut à nouveau publier et commenter."
  });
});

// Delete user by admin
app.delete("/api/admin/users/:id", (req: Request, res: Response) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  const admin = db.users.find((u) => u.id === token);
  if (!admin || admin.role !== "admin") {
    res.status(403).json({ error: "Accès refusé." });
    return;
  }

  const userIndex = db.users.findIndex((u) => u.id === req.params.id);
  if (userIndex === -1) {
    res.status(404).json({ error: "Utilisateur non trouvé." });
    return;
  }

  const target = db.users[userIndex];
  if (target.role === "admin") {
    res.status(400).json({ error: "Impossible de supprimer le compte administrateur principal." });
    return;
  }

  const deletedId = target.id;
  db.users.splice(userIndex, 1);
  saveDatabase();
  broadcast("USER_DELETED", { userId: deletedId });
  res.json({ success: true, id: deletedId });
});

// ======================== VITE MIDDLEWARE & STATIC ========================

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Serveur Médecine Sfax opérationnel sur http://0.0.0.0:${PORT}`);
  });
}

startServer();
