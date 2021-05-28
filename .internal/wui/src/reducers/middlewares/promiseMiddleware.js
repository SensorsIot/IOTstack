import { API_STATUS } from '../../constants';

const promiseMiddleware = () => {
  return next => action => {
    const { promise, type, label, ...rest } = action;
   
    if (!promise) {
      return next(action);
    }
   
    const SUCCESS = type + `_${API_STATUS.SUCCESS}`;
    const PENDING = type + `_${API_STATUS.PENDING}`;
    const FAILURE = type + `_${API_STATUS.FAILURE}`;

    next({ ...rest, type: PENDING, label });
    
    return promise.then(res => {
        next({ ...rest, res, type: SUCCESS, label });
        
        return true;
      }).catch(error => {
        next({ ...rest, error, type: FAILURE, label });

        return false;
      });
   }; 
}

export default promiseMiddleware;
