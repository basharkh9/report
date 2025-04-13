import { combineReducers } from 'redux';
import entitiesReducer from './entities';
import filterSettingsReducer from './filterSettings';

export default combineReducers({
  entities: entitiesReducer,
  filterSettings: filterSettingsReducer,
});
