const GET_USER = 'get/user';
const GET_CONTACT = 'get/contact';
const GET_CALL = 'get/call';
const INIT = 'init';
const ON_CALL = 'on/call';
const OFF_CALL = 'off/call';

const CONVERSATION_SIDEBAR = 'conversation_sidebar';

const ALLOWED_PATHS = {
  [CONVERSATION_SIDEBAR]: [
    GET_USER,
    GET_CONTACT,
    GET_CALL,
    INIT,
    ON_CALL,
    OFF_CALL,
  ],
};

const SUBSCRIPTION_PATHS = [
  ON_CALL,
];

const OK = 'OK';
const NOT_FOUND = 'NOT_FOUND';
const NOT_INITIALIZED = 'NOT_INITIALIZED';
const PATH_NOT_FOUND = 'PATH_NOT_FOUND';
const SUBSCRIPTION_ADDED = 'SUBSCRIPTION_ADDED';
const SUBSCRIPTION_REMOVED = 'SUBSCRIPTION_REMOVED';

const ERROR_STATUSES = [
  NOT_FOUND,
  NOT_INITIALIZED,
  PATH_NOT_FOUND,
];

export default {
  GET_USER,
  GET_CONTACT,
  GET_CALL,
  ON_CALL,
  OFF_CALL,
  INIT,
  CONVERSATION_SIDEBAR,
  ALLOWED_PATHS,
  OK,
  NOT_FOUND,
  NOT_INITIALIZED,
  PATH_NOT_FOUND,
  SUBSCRIPTION_ADDED,
  SUBSCRIPTION_REMOVED,
  SUBSCRIPTION_PATHS,
  ERROR_STATUSES,
};
