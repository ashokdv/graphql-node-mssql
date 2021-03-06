const sql = require("mssql");
const connString = require("../connstring");
const conn = sql.connect(connString);
const SELECT = `SELECT TOP 20 id, description, isCompleted, dueDate, creationDate, completedDate, completedByContactId FROM BE2_Tasks t WHERE OrganizationId = 189272 and description != '' `;

module.exports = {
  Comment: {
    async attachments(comment) {
      let pool = await conn;
      let result = await pool
        .request()
        .query(
          `SELECT r.id, r.fileName, r.name FROM BE2_TaskCommentResources tcr JOIN BE_Resources r ON tcr.ResourceId = r.Id WHERE tcr.CommentId = ` +
            comment.id
        );
      return result.recordsets[0];
    }
  },
  Task: {
    async comments(task) {
      let pool = await conn;
      let result = await pool.request().query(`SELECT id, description FROM BE2_TaskComments WHERE TaskId = ` + task.id);
      return result.recordsets[0];
    },
    async attachments(task) {
      let pool = await conn;
      let result = await pool
        .request()
        .query(`SELECT r.id, r.fileName, r.name FROM BE2_TaskResources tr JOIN BE_Resources r ON tr.ResourceId = r.Id WHERE tr.TaskId = ` + task.id);
      return result.recordsets[0];
    }
  },
  Query: {
    async allTasks(root, args, context, ast) {
      let pool = await conn;
      let query = SELECT;

      if (args.id) {
        query += " AND id = " + args.id + " ";
      }
      if (args.description_like) {
        query += " AND Description LIKE '%" + args.description_like + "%' ";
      }
      if (args.withComments) {
        query +=
          " AND EXISTS ( SELECT 0 FROM BE2_TaskComments tc JOIN BE2_TaskCommentResources tcr ON tc.Id = tcr.CommentId WHERE tc.TaskId = t.Id ) ";
      }
      if (args.withAttachments) {
        query += " AND EXISTS ( SELECT 0 FROM BE2_TaskResources tr WHERE tr.TaskId = t.Id ) ";
      }

      let result = await pool.request().query(`${query} ORDER BY Description`);
      return result.recordsets[0];
    }
  }
};
