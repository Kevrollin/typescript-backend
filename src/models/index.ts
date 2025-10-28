import { User } from './User';
import { Student } from './Student';
import { Project } from './Project';
import { Donation } from './Donation';
import { Campaign } from './Campaign';
import { CampaignParticipation } from './CampaignParticipation';
import { CampaignLike } from './CampaignLike';
import { CampaignSubmission } from './CampaignSubmission';

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

// Campaign associations
User.hasMany(Campaign, {
  foreignKey: 'createdBy',
  as: 'campaigns',
});

Campaign.belongsTo(User, {
  foreignKey: 'createdBy',
  as: 'creator',
});

// Campaign Participation associations
User.hasMany(CampaignParticipation, {
  foreignKey: 'userId',
  as: 'campaignParticipations',
});

CampaignParticipation.belongsTo(User, {
  foreignKey: 'userId',
  as: 'participant',
});

Campaign.hasMany(CampaignParticipation, {
  foreignKey: 'campaignId',
  as: 'participations',
});

CampaignParticipation.belongsTo(Campaign, {
  foreignKey: 'campaignId',
  as: 'campaign',
});

// Reviewer association
User.hasMany(CampaignParticipation, {
  foreignKey: 'reviewedBy',
  as: 'reviewedParticipations',
});

CampaignParticipation.belongsTo(User, {
  foreignKey: 'reviewedBy',
  as: 'reviewer',
});

// Campaign Like associations
User.hasMany(CampaignLike, {
  foreignKey: 'userId',
  as: 'campaignLikes',
});

CampaignLike.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

Campaign.hasMany(CampaignLike, {
  foreignKey: 'campaignId',
  as: 'likes',
});

CampaignLike.belongsTo(Campaign, {
  foreignKey: 'campaignId',
  as: 'campaign',
});

// Campaign Submission associations
User.hasMany(CampaignSubmission, {
  foreignKey: 'userId',
  as: 'campaignSubmissions',
});

CampaignSubmission.belongsTo(User, {
  foreignKey: 'userId',
  as: 'submitter',
});

Campaign.hasMany(CampaignSubmission, {
  foreignKey: 'campaignId',
  as: 'submissions',
});

CampaignSubmission.belongsTo(Campaign, {
  foreignKey: 'campaignId',
  as: 'campaign',
});

CampaignParticipation.hasOne(CampaignSubmission, {
  foreignKey: 'participationId',
  as: 'submission',
});

CampaignSubmission.belongsTo(CampaignParticipation, {
  foreignKey: 'participationId',
  as: 'participation',
});

// Grader association
User.hasMany(CampaignSubmission, {
  foreignKey: 'gradedBy',
  as: 'gradedSubmissions',
});

CampaignSubmission.belongsTo(User, {
  foreignKey: 'gradedBy',
  as: 'grader',
});

export {
  User,
  Student,
  Project,
  Donation,
  Campaign,
  CampaignParticipation,
  CampaignLike,
  CampaignSubmission,
};
