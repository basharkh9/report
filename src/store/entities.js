import { combineReducers } from '@reduxjs/toolkit';
import bugsReducer from './bugs';
import projectsReducer from './projects';
import availableEntitiesReducer from './availableEntities';
import usersReducer from './users';

export default combineReducers({
  bugs: bugsReducer,
  projects: projectsReducer,
  users: usersReducer,
  availableEntities: availableEntitiesReducer,
});
