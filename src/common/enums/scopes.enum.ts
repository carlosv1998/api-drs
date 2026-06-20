export enum SCOPE_NAME {
  SCOPES_CREATE = 'scopes:create',
  SCOPES_UPDATE = 'scopes:update',
  SCOPES_DELETE = 'scopes:delete',
  SCOPES_READ = 'scopes:read',

  ROLES_CREATE = 'roles:create',
  ROLES_UPDATE = 'roles:update',
  ROLES_READ = 'roles:read',
  ROLES_DELETE = 'roles:delete',

  //permissions
  PERMISSIONS_CREATE = 'permissions:create',
  PERMISSIONS_UPDATE = 'permissions:update',
  PERMISSIONS_DELETE = 'permissions:delete',

  //vehicles
  VEHICLES_CREATE = 'vehicles:create',
  VEHICLES_UPDATE = 'vehicles:update',
  VEHICLES_READ = 'vehicles:read',
  VEHICLES_DELETE = 'vehicles:delete',

  //products
  LOGISTIC_PRODUCTS_READ = 'logistic:products:read',
  LOGISTIC_PRODUCTS_CREATE = 'logistic:products:create',
  LOGISTIC_PRODUCTS_UPDATE = 'logistic:products:update',
  LOGISTIC_PRODUCTS_DELETE = 'logistic:products:delete',

  //TODO: agregar scopes de documentos (art, etc)
  DOCUMENTS_ART_READ = 'document:art:read',
  DOCUMENTS_ART_CREATE = 'document:art:create',

  DOCUMENTS_CAPACITACION_DIFUSION_READ = 'document:capacitacion-difusion:read',
  DOCUMENTS_CAPACITACION_DIFUSION_CREATE = 'document:capacitacion-difusion:create',
}
