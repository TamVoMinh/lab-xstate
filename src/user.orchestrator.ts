import { interpret, State, DoneEvent } from 'xstate'
import isNil from 'lodash.isnil'
import {xStateMachine, UserContext, UserEvent, xUserStateSchema} from './user.fsm'
import * as store from './stateStore'

const orchestrator = async (userId:Number) =>{

  const actor = interpret(xStateMachine);
  
  actor.subscribe(
    state => console.log('\nsubscribe', state.changed, state.event),
    error => console.log(error),
    () => console.log('actor completes the actions execution')
  )

  actor.onChange((context)=>{
      console.log('\nContext Changed', context)
      if(actor.state.changed){
        console.log('Context Changed & State changed -> persist state', actor.state.changed, actor.state.value)
        store.persistState(userId, actor.getSnapshot())
      }
  })

  actor.onDone((event:DoneEvent) => {
    console.log('the process has been completed', event)
  })

  let [errorMessage, previousStateString] = await store.loadState(userId)

  let previousState:any = isNil(errorMessage)
    ? State<UserContext, UserEvent, xUserStateSchema>.create(JSON.parse(previousStateString))
    : xStateMachine.initialState

  actor.start(previousState);
  
  if(actor.state.nextEvents){
    actor.state.nextEvents.forEach(event => {
      let cmdEvent: UserEvent
      switch(event){
        case 'FETCH': 
          cmdEvent ={type: 'FETCH', id: userId}
          break
        case 'RETRY':
          cmdEvent = {type:'RETRY'}
          break
        case 'CANCEL':
          cmdEvent = {type: 'CANCEL'}
          break
      }
      console.log(cmdEvent, 'can send event?', actor.state.can(cmdEvent))
      actor.state.can(cmdEvent) && actor.send(cmdEvent)
    });
  }
}

orchestrator(123)
