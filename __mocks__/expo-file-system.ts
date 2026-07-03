// Jest runs under plain Node (testEnvironment: "node"), not React Native, so
// expo-file-system's native module can't load — same reason expo-constants
// and async-storage are mocked here. Real usage (converting a captured photo
// to base64 before sending it to the backend) only runs on-device.
export class File {
  constructor(private uri: string) {}

  async base64(): Promise<string> {
    return `mock-base64:${this.uri}`;
  }

  base64Sync(): string {
    return `mock-base64:${this.uri}`;
  }
}
