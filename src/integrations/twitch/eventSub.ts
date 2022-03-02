import express, { Request, Response } from 'express'
import { EventBus } from '../../events'
import { Twitch } from './index'
import { 
  BotEvents, 
  log, 
  LogLevel, 
  IUserEvent, 
  OnCheerEvent, 
  OnFollowEvent, 
  OnRaidEvent, 
  OnStreamEndEvent, 
  OnStreamChangeEvent,
  OnSubEvent, 
  Stream, 
  TwitchFollowEvent,
  TwitchStreamEvent,
  User } from '../../common'
import { State } from '../../state'

 const webhookRouter: express.Router = express.Router()

webhookRouter.use(express.raw({          // Need raw message body for signature verification
    type: 'application/json'
}));

export default webhookRouter;

webhookRouter.post('/stream', Twitch.validateWebhook, async (request: Request, response: Response) => {
  const payload: TwitchStreamEvent = JSON.parse(request.body);
  response.contentType('text/plain');

  switch (request.headers['twitch-eventsub-message-type']) {

    case 'webhook_callback_verification': // Verify the endpoint for Twitch 
      response.status(200).send(payload.challenge);
      break;

    case 'notification': // Handle the event from Twitch

      switch (payload.subscription.type) {

        case "stream.online":
          const stream = new Stream(
            payload.event.id,
            payload.event.started_at,
            payload.event.started_at,
            payload.event.id
          );
          emit(BotEvents.OnStreamChange, new OnStreamChangeEvent(stream));
          break;

        case "stream.offline":
          const existingStream = await State.getStream()

          if (existingStream) {
            emit(BotEvents.OnStreamEnd, new OnStreamEndEvent(existingStream));
          }
          break;
      }

      response.status(204);
      break;

    case 'revocation': // Re-register the webhook with Twitch

      response.status(204);
      break;
  }
})

webhookRouter.post('/follow', Twitch.validateWebhook, async (request: Request, response: Response) => {
  const payload: TwitchFollowEvent = JSON.parse(request.body);
  response.contentType('text/plain');

  switch (request.headers['twitch-eventsub-message-type']) {

    case 'webhook_callback_verification': // Verify the endpoint for Twitch 
      response.status(200).send(payload.challenge);
      break;

    case 'notification': // Handle the event from Twitch

      let userInfo: User
      try {
        userInfo = await Twitch.getUser(payload.event.user_name.toLocaleLowerCase())
      }
      catch (err) {
        log(LogLevel.Error, `webhooks: /follow - ${err}`)
      }

      emit(BotEvents.OnFollow, new OnFollowEvent(userInfo));

      response.status(204);
      break;

    case 'revocation': // Re-register the webhook with Twitch

      response.status(204);
      break;
  }
})

webhookRouter.post('/test/raid', async (request: Request, response: Response) => {
  const { name, viewers } = request.body;
  
  let userInfo: User
  try {
    userInfo = await Twitch.getUser(name.toLocaleLowerCase())
  }
  catch (err) {
    log(LogLevel.Error, `webhooks: /test/raid - ${err}`)
  }

  emit(BotEvents.OnRaid, new OnRaidEvent(userInfo, viewers))

  response.status(200).send();
})

webhookRouter.post('/test/follow', async (request: Request, response: Response) => {
  let { name } = request.body;
  name = name.toLocaleLowerCase();

  let userInfo: User
  try {
    userInfo = await Twitch.getUser(name)
  }
  catch (err) {
    log(LogLevel.Error, `webhooks: /test/follow - ${err}`)
  }

  emit(BotEvents.OnFollow, new OnFollowEvent(userInfo))

  response.status(200).send();
})

webhookRouter.post('/test/sub', async (request: Request, response: Response) => {
  let { name } = request.body;
  name = name.toLocaleLowerCase();

  let userInfo: User
  try {
    userInfo = await Twitch.getUser(name)
  }
  catch (err) {
    log(LogLevel.Error, `webhooks: /test/sub - ${err}`)
  }

  emit(BotEvents.OnSub, new OnSubEvent(userInfo, 'blah', null, null, 3, null));

  response.status(200).send();
})

webhookRouter.post('/test/cheer', async (request: Request, response: Response) => {
  const { name, bits } = request.body;

  let userInfo: User
  try {
    userInfo = await Twitch.getUser(name.toLocaleLowerCase())
  }
  catch (err) {
    log(LogLevel.Error, `webhooks: /test/cheer - ${err}`)
  }

  emit(BotEvents.OnCheer, new OnCheerEvent(userInfo, 'blah', bits, null, null));

  response.status(200).send();
})

const emit = (event: BotEvents, payload: IUserEvent | OnStreamChangeEvent) => {
  EventBus.eventEmitter.emit(event, payload)
}