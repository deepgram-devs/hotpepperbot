import { User, Stream } from "../common"
import { CacheType } from "./cacheType"

export abstract class Cache {

  private static users: User[] = []
  private static streams: Stream[] = []

  public static get(cacheType: CacheType, identifier: string): unknown {
    switch (cacheType) {
      case CacheType.Stream:
        return this.streams.find(f => f.streamDate === identifier)
      case CacheType.User:
        return this.users.find(f => f.login === identifier)
    }
  }

  public static set(cacheType: CacheType, object: unknown): void {
    switch (cacheType) {
      case CacheType.Stream: {
        const stream: Stream = object as Stream
        const newStreams = this.streams.filter(f => f.streamDate !== stream.streamDate)
        this.streams = [...newStreams, stream]
        break;
      }
      case CacheType.User: {
        const user: User = object as User
        const newUsers = this.users.filter(f => f.login !== user.login)
        this.users = [...newUsers, user]
        break;
      }
    }
  }
}