/**
 * Infrastructure Deployment Agent - Docker and service management
 */

const BaseAgent = require('../../core/base-agent');
const { execSync } = require('child_process');

class InfrastructureDeploymentAgent extends BaseAgent {
  constructor() {
    super({
      name: 'vg-infrastructure-deployment',
      version: '2.0.0',
      description: 'Docker orchestration and service deployment agent',
      capabilities: ['build_containers', 'deploy_service', 'health_check', 'restart_services']
    });
  }

  async execute(task) {
    switch (task.action) {
      case 'build_containers':
        return await this.buildContainers(task);
      case 'deploy_service':
        return await this.deployService(task);
      case 'health_check':
        return await this.healthCheck(task);
      case 'restart_services':
        return await this.restartServices(task);
      default:
        return { success: true, message: 'Infrastructure action completed' };
    }
  }

  async buildContainers(task) {
    const { services = [] } = task.payload || {};
    this.log(`Building containers for: ${services.join(', ')}`);

    try {
      const cmd = services.length > 0
        ? `docker-compose build ${services.join(' ')}`
        : 'docker-compose build';
      execSync(cmd, { cwd: process.cwd() });
      return { success: true, built: services };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async deployService(task) {
    const { service } = task.payload || {};
    this.log(`Deploying service: ${service}`);

    try {
      execSync(`docker-compose up -d ${service}`, { cwd: process.cwd() });
      return { success: true, deployed: service };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async healthCheck(task) {
    const { services = [] } = task.payload || {};
    this.log('Running health checks...');

    const health = {};
    for (const service of services) {
      try {
        execSync(`docker-compose ps ${service}`, { cwd: process.cwd() });
        health[service] = 'healthy';
      } catch {
        health[service] = 'unhealthy';
      }
    }

    return { success: true, health };
  }

  async restartServices(task) {
    const { services = [] } = task.payload || {};
    this.log(`Restarting services: ${services.join(', ')}`);

    try {
      execSync(`docker-compose restart ${services.join(' ')}`, { cwd: process.cwd() });
      return { success: true, restarted: services };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = InfrastructureDeploymentAgent;