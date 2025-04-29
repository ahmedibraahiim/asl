// Type definitions for ASL assets
declare module '*.svg' {
  const content: string;
  export default content;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}

// Declare the ASL alphabet assets
declare module 'assets/asl_alphabets/*.svg' {
  const url: string;
  export default url;
}

declare module 'assets/icon/*.svg' {
  const url: string;
  export default url;
} 