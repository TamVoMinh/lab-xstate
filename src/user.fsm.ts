import { assign, DoneInvokeEvent, MachineOptions, MachineConfig, Machine } from 'xstate';
import { fetchUser } from './apiClient'
import User from './user'

interface UserContext {
  user?: User;
  error?: string;
  retry: number;
}

type UserEventFetch =  { type: 'FETCH'; id: Number }
type UserEventResolve =  { type: 'RESOLVE'; user: User }
type UserEventReject =  { type: 'REJECT'; error: string }
type UserEventReset = {type:'RETRY'}
type UserEventCancel = {type:'CANCEL'}

type UserEvent =
  |UserEventFetch
  |UserEventResolve
  |UserEventReject
  |UserEventReset
  |UserEventCancel
  |DoneInvokeEvent<User|string>;

type IDLE = {
  value: 'idle';
  context: UserContext & { user: undefined; error: undefined; }
}

type LOADING = {
  value: 'loading';
  context: UserContext & { user: undefined; error: undefined; }
}

type SUCCESS = {
  value: 'success';
  context: UserContext & { user: User; error: undefined};
}

type FAILURE = {
  value: 'failure';
  context: UserContext & { user: undefined; error: string };
}

type ERROR ={
  value:'error',
  context: UserContext & { user: undefined; error: string };
  
}

interface xUserStateSchema {
  states:{
    idle: IDLE;
    loading: LOADING;
    success: SUCCESS;
    failure: FAILURE;
    error: ERROR;
  }
}

const xStateOptions: Partial<MachineOptions<UserContext, UserEvent>> = {
  actions:{
    setUser: assign({
      user: (context:UserContext, event:DoneInvokeEvent<User>) =>  event.data,
      retry: (context:UserContext, event:DoneInvokeEvent<User>) => context.retry
    }),
    setError: assign({
      error:(context: UserContext, event:DoneInvokeEvent<string>) => event.data,
      retry: (context:UserContext, event:DoneInvokeEvent<User>) => context.retry
    }),
    countRetry: assign ({
      user:(context: UserContext, event:UserEventReset) => undefined,
      error: (context: UserContext, event:UserEventReset) => '',
      retry: (context: UserContext, event:UserEventReset) => context.retry + 1
    })
  },
  services:{
    getUser: (context: UserContext, event: UserEventFetch) =>  fetchUser(event.id),
  },
  guards:{
    shouldRetry: (context: UserContext, event:UserEvent) => context.retry < 3,
    shouldCancel: (context: UserContext, event:UserEvent) => context.retry >= 3
  }
}

const xMachineConfig: MachineConfig<UserContext, xUserStateSchema, UserEvent> = {
  id:'user-fetching-example',
  initial: 'idle',
  context:{
    user: undefined,
    error:"",
    retry:0
  },
  states: {
    idle: {
      on:{
        FETCH: {
          target: 'loading'
        }
      }
    },
    loading: {
      invoke: {
        id: 'getUser',
        src: 'getUser',
        onDone: {
          target: 'success',
          actions: ['setUser']
        },
        onError: {
          target: 'error',
          actions: 'setError'
        }
      }
    },
    success: {
      type:'final'
    },
    error:{
      on:{
        RETRY:{
          target:  'idle',
          cond: 'shouldRetry',
          actions: 'countRetry' 
        },
        CANCEL:{
          cond: 'shouldCancel',
          target: 'failure'
        }
      }
    },
    failure: {
      type:'final'
    }
  }
}

const xStateMachine = Machine<UserContext, xUserStateSchema, UserEvent>(
  xMachineConfig,
  xStateOptions
)

export {
  UserContext,
  UserEvent,
  xUserStateSchema,
  xStateMachine
}
