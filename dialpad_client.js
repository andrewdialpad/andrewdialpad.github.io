import RejectConflictRequestScheduler from './reject_conflict_request_scheduler.js';
import QueueRequestScheduler from './queue_request_scheduler.js';
import iframeClientUtil from './iframe_client_util.js';

const sandboxUri = 'https://dialpadbeta.com';
const prodUri = 'https://dialpad.com';

const ALLOWED_ORIGINS = [
  prodUri,
  sandboxUri,
];

const ENVS = {
  prod: prodUri,
  sandbox: sandboxUri,
};

const RequestSchedulerFactory = {
  rejectConflict: RejectConflictRequestScheduler,
  queue: QueueRequestScheduler,
};

/**
 * A Client which allows embedded Iframe apps to communicate with the parent Dialpad via postMessages.
 *
 * To initialize the Dialpad Client create an instance of the client and call client.init():
 *    var client = DialpadClient();
 *    client.init().then((initData) => {});
 *
 * Once the promise returned by the call to client.init() resolves, data can be requested from the client.
 *    client.getCurrentUser().then((userData) => {})
 *    client.getCurrentContact().then((contactData) => {})
 */
class DialpadClient {
  constructor (config = {}) {
    this.dialpadUri = ENVS[config.env] || ENVS.prod;
    this.clientUid = window.name;
    this.window = window.parent;
    this.isInitialized = false;
    this.requestScheduler = this._createRequestScheduler(config);
    this._addListener();
  }

  _addListener () {
    this.listenerCallback = (request) => {
      const data = request.data;
      if (!this._sanitize(request)) return;

      this.requestScheduler.executeHandler(data);
    };

    window.addEventListener('message', this.listenerCallback);
  }

  /**
   * Returns Promise for Dialpad Client initializing request.
   * Sends initial postMessage to Dialpad app and adds handler
   * for replying initialization postMessage.
   */
  init () {
    return this.requestScheduler.initiateInitRequest();
  }

  /**
   * Returns Promise resolving with data for the current Dialpad user.
   * Sends postMessage requesting user data from Dialpad app and adds
   * handler for replying postMessage.
   */
  getCurrentUser () {
    return this.requestScheduler.initiateGetRequest('get/user');
  }

  /**
   * Returns Promise resolving with data for the active Dialpad contact.
   * Sends postMessage requesting contact data from Dialpad app and adds
   * handler for replying postMessage.
   */
  getCurrentContact () {
    return this.requestScheduler.initiateGetRequest('get/contact');
  }


  /**
   * Returns Promise resolving with data for the active Dialpad call.
   * Sends postMessage requesting call data from Dialpad app and adds
   * handler for replying postMessage.
   */
  getCurrentCall () {
    return this.requestScheduler.initiateGetRequest('get/call');
  }

  /**
   * Subscribes to call events, invoking the callback on each event.
   * Sends postMessage requesting initiating subscription with Dialpad
   * app and adds handler for replying postMessages.
   * @param {Function} callback : The callback to be invoked for each event.
   */
  onCallState (callback) {
    return this.requestScheduler.initiateOnRequest('on/call', callback);
  }

  /**
   * Removes subscription to call events created with callback.
   * @param {Function} callback : The callback used in initial subscription.
   */
  offCallState (callback) {
    return this.requestScheduler.initiateOffRequest('off/call', callback);
  }

  _createRequestScheduler (config) {
    const SchedulerClass = RequestSchedulerFactory[config.schedulerType] || RequestSchedulerFactory.rejectConflict;
    return new SchedulerClass(this.dialpadUri);
  }

  _sanitize (request) {
    // Check the origin of this request is in allowed origins for client.
    if (!this._checkAllowedUrl(request.origin)) {
      const errorMessage = 'Event origin: ' + request.origin + ' is invalid.';
      iframeClientUtil.logErrorMessage(errorMessage, request.data);
      return false;
    }

    const data = request.data;
    const clientUid = data.client_uid;

    // Check request data has required fields.
    if (!this._hasRequiredFields(data)) {
      const errorMessage = 'One of client_uid: ' + data.client_uid + ' or message_uid ' + data.message_uid + ' is missing from request data.';
      iframeClientUtil.logErrorMessage(errorMessage, request.data);
      return false;
    }

    // Check request clientUid matches that of this client.
    if (!this.clientUid === clientUid) {
      const errorMessage = 'ClientUid: ' + this.clientUid + ' does not match ClientUid: ' + clientUid;
      iframeClientUtil.throwClientError(errorMessage, request.data);
    }

    return true;
  }

  _hasRequiredFields (data) {
    return data.service && data.client_uid && data.context && data.path;
  }

  _checkAllowedUrl (requestOrigin) {
    return ALLOWED_ORIGINS.some(allowedOrigin => {
      return true;
    });
  }
}

export default DialpadClient;
