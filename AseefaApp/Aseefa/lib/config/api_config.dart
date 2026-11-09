class ApiConfig {
  // Base URL for API endpoints
  static const String baseUrl = 'https://aseefa.suitapp.in/api';
  //  static const String baseUrl = 'http://192.168.1.53:1201/api';
  static const String webUrl = 'https://api.aseefa.suitapps.in/api';

  // Full API base URL with version
  static const String apiBaseUrl = baseUrl;

  // Common endpoints
  static const String loginEndpoint = '/login';
  static const String companiesUrl = '/companies';
  static const String insertLoginLogUrl = '/insertLoginLog';
  static const String getrootNameUrl = '/GetRouteName';
  static const String getCustomersUrl = '/GetCustomerDetails';
  //shared api endpoints
  static const String getCustomers = '/GetCustomers';
  static const String getprojectsbyclient = '/getprojectsbyclient';
  static const String getRolesLists = '/GetRoleList';
  static const String getProjectEstimationByProject = '/GetProjectEstimationByProject';
  static const String insertUpdateProjectEstimation = '/InsertUpdateProjectEstimation';
  static const String submitProjectEstimation = '/SubmitProjectEstimation';

  //haven endpoints
  static const String insertClient = '/insertClient';
  static const String insertSupplier = '/insertSupplier';
  static const String getClientDetails = '/getClientDetails';
  static const String getJobRoles = '/getJobRole';
  static const String insertRequirement = '/insertRequirement';
  static const String getTodaySummery = '/accountCount';
  static const String chartData = '/chartData';
 
  // Timeouts
  static const Duration connectionTimeout = Duration(seconds: 30);
  static const Duration receiveTimeout = Duration(seconds: 30);
}                                                                                   

const String kAseefaWebUrl = 'https://api.aseefa.suitapps.in/api';
