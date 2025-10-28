import { User } from './User';
import { Student } from './Student';
import { Project } from './Project';
import { Donation } from './Donation';

// Define associations
User.hasOne(Student, {
  foreignKey: 'userId',
  as: 'studentProfile',
});

Student.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

User.hasMany(Project, {
  foreignKey: 'creatorId',
  as: 'projects',
});

Project.belongsTo(User, {
  foreignKey: 'creatorId',
  as: 'creator',
});

User.hasMany(Donation, {
  foreignKey: 'donorId',
  as: 'donations',
});

Donation.belongsTo(User, {
  foreignKey: 'donorId',
  as: 'donor',
});

Project.hasMany(Donation, {
  foreignKey: 'projectId',
  as: 'donations',
});

Donation.belongsTo(Project, {
  foreignKey: 'projectId',
  as: 'project',
});

export {
  User,
  Student,
  Project,
  Donation,
};
