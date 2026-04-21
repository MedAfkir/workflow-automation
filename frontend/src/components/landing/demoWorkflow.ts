import type { TaskRunState } from '@/lib/types';
export const DEMO_NAMESPACE = 'demo';
export const DEMO_KEY = 'greet';
export const DEMO_REVISION = 3;
export type TaskId = 'hello' | 'fetch_users' | 'each';
export interface DemoTask {
  id: TaskId;
  type: string;
  typeShort: string;
  dependsOn: TaskId[];
  x: number;
  y: number;
}
export const NODE_W = 150;
export const NODE_H = 56;
export const CANVAS_W = 480;
export const CANVAS_H = 300;
export const DEMO_TASKS: DemoTask[] = [{
  id: 'hello',
  type: 'io.workflowplatform.builtin.Log',
  typeShort: 'Log',
  dependsOn: [],
  x: 70,
  y: 36
}, {
  id: 'fetch_users',
  type: 'io.workflowplatform.builtin.Http',
  typeShort: 'Http',
  dependsOn: [],
  x: 260,
  y: 36
}, {
  id: 'each',
  type: 'io.workflowplatform.builtin.ForEach',
  typeShort: 'ForEach',
  dependsOn: ['hello', 'fetch_users'],
  x: 165,
  y: 208
}];
export interface DemoEdge {
  from: TaskId;
  to: TaskId;
}
export const DEMO_EDGES: DemoEdge[] = DEMO_TASKS.flatMap(t => t.dependsOn.map(from => ({
  from,
  to: t.id
})));
export type Tok = {
  t: 'comment';
  v: string;
} | {
  t: 'key';
  v: string;
} | {
  t: 'str';
  v: string;
} | {
  t: 'punct';
  v: string;
} | {
  t: 'plain';
  v: string;
};
export interface YamlLine {
  toks: Tok[];
  taskId?: TaskId;
}
export const DEMO_YAML: YamlLine[] = [{
  toks: [{
    t: 'comment',
    v: '# demo/greet - revision 3 - canonical source'
  }]
}, {
  toks: [{
    t: 'key',
    v: 'namespace:'
  }, {
    t: 'plain',
    v: ' demo'
  }]
}, {
  toks: [{
    t: 'key',
    v: 'key:'
  }, {
    t: 'plain',
    v: ' greet'
  }]
}, {
  toks: [{
    t: 'key',
    v: 'inputs:'
  }]
}, {
  toks: [{
    t: 'plain',
    v: '  name:'
  }, {
    t: 'punct',
    v: ' { '
  }, {
    t: 'key',
    v: 'type:'
  }, {
    t: 'plain',
    v: ' string'
  }, {
    t: 'punct',
    v: ', '
  }, {
    t: 'key',
    v: 'required:'
  }, {
    t: 'plain',
    v: ' true'
  }, {
    t: 'punct',
    v: ' }'
  }]
}, {
  toks: [{
    t: 'key',
    v: 'tasks:'
  }]
}, {
  taskId: 'hello',
  toks: [{
    t: 'punct',
    v: '  - '
  }, {
    t: 'key',
    v: 'id:'
  }, {
    t: 'str',
    v: ' hello'
  }]
}, {
  toks: [{
    t: 'plain',
    v: '    '
  }, {
    t: 'key',
    v: 'type:'
  }, {
    t: 'plain',
    v: ' io.workflowplatform.builtin.Log'
  }]
}, {
  toks: [{
    t: 'plain',
    v: '    '
  }, {
    t: 'key',
    v: 'with:'
  }, {
    t: 'punct',
    v: ' { '
  }, {
    t: 'key',
    v: 'message:'
  }, {
    t: 'str',
    v: ' "Hello {{ inputs.name }}!"'
  }, {
    t: 'punct',
    v: ' }'
  }]
}, {
  taskId: 'fetch_users',
  toks: [{
    t: 'punct',
    v: '  - '
  }, {
    t: 'key',
    v: 'id:'
  }, {
    t: 'str',
    v: ' fetch_users'
  }]
}, {
  toks: [{
    t: 'plain',
    v: '    '
  }, {
    t: 'key',
    v: 'type:'
  }, {
    t: 'plain',
    v: ' io.workflowplatform.builtin.Http'
  }]
}, {
  toks: [{
    t: 'plain',
    v: '    '
  }, {
    t: 'key',
    v: 'with:'
  }]
}, {
  toks: [{
    t: 'plain',
    v: '      '
  }, {
    t: 'key',
    v: 'url:'
  }, {
    t: 'plain',
    v: ' https://api.example.com/users'
  }]
}, {
  toks: [{
    t: 'plain',
    v: '      '
  }, {
    t: 'key',
    v: 'method:'
  }, {
    t: 'plain',
    v: ' GET'
  }, {
    t: 'punct',
    v: '  -  '
  }, {
    t: 'key',
    v: 'timeout:'
  }, {
    t: 'plain',
    v: ' PT30S'
  }]
}, {
  taskId: 'each',
  toks: [{
    t: 'punct',
    v: '  - '
  }, {
    t: 'key',
    v: 'id:'
  }, {
    t: 'str',
    v: ' each'
  }]
}, {
  toks: [{
    t: 'plain',
    v: '    '
  }, {
    t: 'key',
    v: 'type:'
  }, {
    t: 'plain',
    v: ' io.workflowplatform.builtin.ForEach'
  }]
}, {
  toks: [{
    t: 'plain',
    v: '    '
  }, {
    t: 'key',
    v: 'dependsOn:'
  }, {
    t: 'punct',
    v: ' ['
  }, {
    t: 'str',
    v: 'hello'
  }, {
    t: 'punct',
    v: ', '
  }, {
    t: 'str',
    v: 'fetch_users'
  }, {
    t: 'punct',
    v: ']'
  }]
}, {
  toks: [{
    t: 'plain',
    v: '    '
  }, {
    t: 'key',
    v: 'with:'
  }, {
    t: 'punct',
    v: ' { '
  }, {
    t: 'key',
    v: 'values:'
  }, {
    t: 'str',
    v: ' "{{ fetch_users.body.users }}"'
  }, {
    t: 'punct',
    v: ', '
  }, {
    t: 'key',
    v: 'concurrency:'
  }, {
    t: 'plain',
    v: ' 4'
  }, {
    t: 'punct',
    v: ' }'
  }]
}];
export interface RunStep {
  dwell: number;
  states: Record<TaskId, TaskRunState>;
  log?: {
    level: 'INFO' | 'WARN' | 'DEBUG';
    taskId: TaskId;
    message: string;
  };
  done?: boolean;
}
const IDLE: Record<TaskId, TaskRunState> = {
  hello: 'PENDING',
  fetch_users: 'PENDING',
  each: 'PENDING'
};
export const IDLE_STATES = IDLE;
export const RUN_SCRIPT: RunStep[] = [{
  dwell: 420,
  states: {
    hello: 'RUNNING',
    fetch_users: 'RUNNING',
    each: 'PENDING'
  },
  log: {
    level: 'INFO',
    taskId: 'hello',
    message: 'scheduled - roots: hello, fetch_users'
  }
}, {
  dwell: 760,
  states: {
    hello: 'SUCCESS',
    fetch_users: 'RUNNING',
    each: 'PENDING'
  },
  log: {
    level: 'INFO',
    taskId: 'hello',
    message: 'Hello Mehdi!'
  }
}, {
  dwell: 900,
  states: {
    hello: 'SUCCESS',
    fetch_users: 'RUNNING',
    each: 'PENDING'
  },
  log: {
    level: 'INFO',
    taskId: 'fetch_users',
    message: 'GET https://api.example.com/users'
  }
}, {
  dwell: 760,
  states: {
    hello: 'SUCCESS',
    fetch_users: 'SUCCESS',
    each: 'WAITING'
  },
  log: {
    level: 'INFO',
    taskId: 'fetch_users',
    message: '200 - 1.2s - 14 users'
  }
}, {
  dwell: 820,
  states: {
    hello: 'SUCCESS',
    fetch_users: 'SUCCESS',
    each: 'RUNNING'
  },
  log: {
    level: 'INFO',
    taskId: 'each',
    message: 'deps resolved - fan-out 14 - concurrency 4'
  }
}, {
  dwell: 1100,
  states: {
    hello: 'SUCCESS',
    fetch_users: 'SUCCESS',
    each: 'SUCCESS'
  },
  log: {
    level: 'INFO',
    taskId: 'each',
    message: '14/14 ok - execution SUCCESS'
  },
  done: true
}];
