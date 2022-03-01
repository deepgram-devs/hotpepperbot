import { shoutOut } from "./commands";
import { Command } from "../common";

export abstract class CommandRegistry {
  private static commands: [Command?] = []

  public static init(): void {
    this.commands = []

    this.commands.push(new Command('so', shoutOut))
  }

  public static getCommand(commandName: string): Command | undefined {
    return this.commands.find(f => f.commandName === commandName)
  }

  public static getCommands(): Command[] {
    return this.commands
  }
}