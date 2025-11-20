const fs = require('fs-extra');
const path = require('path');

class JSONDatabase {
  constructor(dataPath) {
    this.dataPath = dataPath;
  }

  async loadData() {
    try {
      if (await fs.pathExists(this.dataPath)) {
        const data = await fs.readJson(this.dataPath);
        return data;
      }
      return [];
    } catch (error) {
      console.error(`Error loading data from ${this.dataPath}:`, error);
      return [];
    }
  }

  async search(query, field = 'name') {
    const data = await this.loadData();
    const searchTerm = query.toLowerCase();
    
    return data.filter(item => {
      if (item[field] && typeof item[field] === 'string') {
        return item[field].toLowerCase().includes(searchTerm);
      }
      return false;
    });
  }

  async searchMultipleFields(query, fields = ['name']) {
    const data = await this.loadData();
    const searchTerm = query.toLowerCase();
    
    return data.filter(item => {
      return fields.some(field => {
        if (item[field] && typeof item[field] === 'string') {
          return item[field].toLowerCase().includes(searchTerm);
        }
        return false;
      });
    });
  }
}

// Initialize database connections with absolute paths
const dataPath = path.join(__dirname, '../data');
const voterDB = new JSONDatabase(path.join(dataPath, 'voters.json'));
const panDB = new JSONDatabase(path.join(dataPath, 'pan.json'));
const aadharDB = new JSONDatabase(path.join(dataPath, 'aadhar.json'));
const criminalDB = new JSONDatabase(path.join(dataPath, 'criminal.json'));

module.exports = {
  voterDB,
  panDB,
  aadharDB,
  criminalDB
};