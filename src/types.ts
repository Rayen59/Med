export interface User {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  password?: string;
  avatarUrl: string;
  promo: string; // e.g., 'PCEM1', 'PCEM2', 'DCEM1', 'DCEM2', 'DCEM3', 'Interne', 'Résident', 'Enseignant'
  bio?: string;
  role?: 'admin' | 'student';
  isBanned?: boolean;
  banUntil?: string | null; // ISO date string or 'permanent'
  banDuration?: '1d' | '3d' | '14d' | 'permanent' | null;
  banReason?: string;
  isRestricted?: boolean; // Limite aux interactions (peut voir seulement)
  restrictionReason?: string;
  createdAt: string;
}

export type AttachmentType = 'document' | 'audio' | 'video' | 'image';

export interface Attachment {
  id: string;
  name: string;
  type: AttachmentType;
  url: string; // data URL or path
  size?: number; // bytes
  duration?: number; // for audio/video in seconds
}

export interface PostComment {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  userPromo: string;
  content: string;
  createdAt: string;
  parentId?: string; // If this is a reply to another comment
  replyToUserName?: string;
  replies?: PostComment[];
}

export type NotificationType =
  | 'post_like'
  | 'post_comment'
  | 'comment_reply'
  | 'poll_vote'
  | 'quiz_submission';

export interface AppNotification {
  id: string;
  recipientId: string;
  actorId: string;
  actorName: string;
  actorAvatar: string;
  actorPromo: string;
  type: NotificationType;
  title: string;
  message: string;
  targetId: string;
  targetType: 'post' | 'poll' | 'quiz' | 'forum';
  isRead: boolean;
  createdAt: string;
}

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  authorPromo: string;
  content: string;
  tags?: string[];
  attachments: Attachment[];
  likes: string[]; // array of userIds
  comments: PostComment[];
  createdAt: string;
  updatedAt?: string;
}

export interface SpaceFolder {
  id: string;
  userId: string;
  name: string;
  category: string; // classification e.g. 'Cardiologie', 'Anatomie', 'Examen', 'Urgences'
  description?: string;
  color?: string;
  postIds: string[];
  createdAt: string;
}

export interface ForumMessage {
  id: string;
  forumId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  userPromo: string;
  content: string;
  createdAt: string;
}

export interface Forum {
  id: string;
  title: string;
  description: string;
  category: string;
  isPrivate: boolean;
  accessCode?: string; // secret code for private forums
  creatorId: string;
  creatorName: string;
  creatorAvatar: string;
  membersCount: number;
  messagesCount: number;
  createdAt: string;
}

export interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: QuizOption[];
  explanation?: string;
  points: number;
}

export interface QuizSubmission {
  id: string;
  quizId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  userPromo: string;
  score: number;
  totalPoints: number;
  percentage: number;
  submittedAt: string;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  subject: string; // e.g. 'Anatomie', 'Pharmacologie', 'Pédiatrie'
  authorId: string;
  authorName: string;
  authorAvatar: string;
  questions: QuizQuestion[];
  totalPoints: number;
  submissionsCount: number;
  createdAt: string;
}

export interface PollOption {
  id: string;
  text: string;
  votes: string[]; // array of userIds
}

export interface Poll {
  id: string;
  question: string;
  description?: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  options: PollOption[];
  createdAt: string;
}

export interface AppDatabase {
  users: User[];
  posts: Post[];
  spaces: SpaceFolder[];
  forums: Forum[];
  forumMessages: ForumMessage[];
  quizzes: Quiz[];
  quizSubmissions: QuizSubmission[];
  polls: Poll[];
  notifications: AppNotification[];
}
