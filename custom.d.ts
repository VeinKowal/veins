declare module '*.css';
declare module '*.less';
declare module '*.png';
declare module '*.js';
declare module '*.svg' {
  const content: any;
  export default content;
}
