import { createSlice } from '@reduxjs/toolkit';

const slice = createSlice({
    name: 'availableEntities',
    initialState: {
        list: [
            {
                id: 1,
                name: 'Bugs',
                filterFields: [
                    { id: 'id', label: 'ID' },
                    { id: 'description', label: 'Description' },
                    { id: 'userId', label: 'Assigned To' },
                    { id: 'resolved', label: 'Resolved' },
                ]
            },
            {
                id: 2,
                name: 'Bugs2',
                filterFields: [
                    { id: 'id', label: 'ID' },
                    { id: 'description', label: 'Description' },
                    { id: 'userId', label: 'Assigned To' },
                    { id: 'resolved', label: 'Resolved' },
                ]
            }
        ]
    },
    reducers: {
        availableEntitiesRequested: (availableEntities, action) => {
            console.log('availableEntities', availableEntities);
            console.log('availableEntities action', action);
            availableEntities.loading = true;
        }
    },
});

export const { availableEntitiesRequested } = slice.actions;
export default slice.reducer;