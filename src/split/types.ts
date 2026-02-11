export interface Post {
  id: string;
  title: string;
  author: string;
  content: string;
  date: string;
  published?: boolean;
}

export interface Comment {
  id: string;
  postid: string;
  text: string;
  approved?: boolean;
  author: string;
}