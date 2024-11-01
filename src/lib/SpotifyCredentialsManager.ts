export default class SpotifyCredentialsManagerSingleton {
  private refreshToken: string;
  private accessToken?: string;

  // Singleton Instance
  static instance: SpotifyCredentialsManagerSingleton;
  
  constructor() {
    this.refreshToken = import.meta.env.SPOTIFY_REFRESH_TOKEN;
    if ( !SpotifyCredentialsManagerSingleton.instance ) {
      SpotifyCredentialsManagerSingleton.instance = this;
    }
    return SpotifyCredentialsManagerSingleton.instance;
  }

  async generateAccessToken() {
    const authorizationHeader = 'Basic ' + (new (Buffer.from as any)(import.meta.env.SPOTIFY_CLIENT_ID + ':' + import.meta.env.SPOTIFY_CLIENT_SECRET).toString('base64'))
    
    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": authorizationHeader,
      },
      body: new URLSearchParams({
        "grant_type": "refresh_token",
        "refresh_token": this.refreshToken,
      }),
    });

    const data = await response.json();
    this.accessToken = data.access_token;
    return this.accessToken as string;
  }

  async getAccessToken() {
    if ( this.accessToken == null ) return await this.generateAccessToken();
    
    return this.accessToken;
  }
}