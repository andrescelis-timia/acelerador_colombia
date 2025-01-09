import { ObjectResponse, ObjectUpdateWithId, ObjectTableData } from './types';

export const transformToTableData = (objects: ObjectResponse[]): ObjectTableData[] => {  
  const transformed = objects.map(object => ({    
    id_object: object.id_object,
    name: object.name,
    alias: object.alias,
    status: object.status,
    url_document: object.url_document,
    creation_date: object.creation_date
  }));
  return transformed;
};

export const transformToUpdateData = (object: ObjectResponse): ObjectUpdateWithId => ({
  id_object: object.id_object,
  id_project: object.id_project,
  name: object.name,
  alias: object.alias,
  status: object.status,
  url_document: object.url_document,
  update_user: object.update_user || ''
}); 