import { Injectable } from '@nestjs/common';

@Injectable()
export class ApiService {
  getPublicData() {
    return {
      data: 'Public API data',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    };
  }

  getPremiumData() {
    return {
      data: 'Premium API data with advanced features',
      timestamp: new Date().toISOString(),
      features: ['analytics', 'real-time', 'advanced-filters']
    };
  }

  getInternalData() {
    return {
      data: 'Internal API data for microservices',
      timestamp: new Date().toISOString(),
      internal: true,
      serviceId: 'api-service-001'
    };
  }

  getUsers() {
    return {
      users: [
        { id: 1, name: 'John Doe', email: 'john@example.com' },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
      ],
      total: 2
    };
  }
}