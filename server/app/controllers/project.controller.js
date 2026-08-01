const db = require('../models')
const config = require('../config/db.config.js')
///const config = require("../config/db.config.js");
const Sequelize = require('sequelize')

const { authJwt } = require("../middleware");
const { logAudit } = require('../utils/auditTrail')



// Function to compute percentage time spent and update task progress
const xupdateStatus = async () => {
  console.log('Running the periodic task at:', new Date().toISOString());

  try {
    // Fetch all tasks where progress needs to be updated
    const tasks = await db.models.project_task.findAll({
      attributes: ['id', 'name', 'startDate', 'endDate', 'progress', 'time_spent'], // You can add more fields if needed
      where: {
        status: { [Sequelize.Op.ne]: 'Completed' } // Assuming 'completed' is the status for finished tasks
      },
    });

    const currentTime = new Date();

    for (const task of tasks) {
      const { id, startDate, endDate, time_spent } = task;

      // Convert startDate and endDate to Date objects for comparison
      const taskStartDate = new Date(startDate);
      const taskEndDate = new Date(endDate);

      // If the task's startDate is in the future, skip it
      if (currentTime < taskStartDate) {
        // Task has not started yet, so progress should remain 0%
        const percentTimeSpent = 0;
        if (time_spent !== percentTimeSpent) {
          await db.models.project_task.update(
            { time_spent: percentTimeSpent.toFixed(2) }, // Update progress to 0%
            { where: { id } }
          );
          console.log(`Task ID ${id} : ${startDate} : ${endDate} - Progress updated to 0% (task not started yet)`);
        }
        continue; // Skip further processing for this task
      }

      // If the task has started, calculate the progress
      if (currentTime >= taskStartDate && currentTime <= taskEndDate) {
        // Calculate the total time duration between startDate and endDate in milliseconds
        const totalDuration = taskEndDate - taskStartDate;

        // Calculate the time spent from startDate to now in milliseconds
        const timeSpent = currentTime - taskStartDate;

        // Compute percentage of time spent
        const percentTimeSpent = (timeSpent / totalDuration) * 100;

        // Update the task's progress if necessary
        if (time_spent !== percentTimeSpent) {
          await db.models.project_task.update(
            { time_spent: percentTimeSpent.toFixed(2) }, // Update the progress field
            { where: { id } } // Only update the current task
          );

          console.log(`Task ID ${id} : ${startDate} : ${endDate} updated with progress: ${percentTimeSpent.toFixed(2)}%`);
        }
      }

      // If the task has ended (currentTime > taskEndDate), set progress to 100%
      if (currentTime > taskEndDate && time_spent !== 100) {
        await db.models.project_task.update(
          { time_spent: 100 }, // Set progress to 100% as the task is completed
          { where: { id } }
        );
        console.log(`Task ID ${id} : ${startDate} : ${endDate} - Progress updated to 100% (task completed)`);
      }
    }
  } catch (error) {
    console.error('Error updating task progress:', error);
  }
};

// Function to compute percentage time spent and update task progress
 // Function to compute percentage time spent and update task progress
const updateStatus = async () => {
  console.log('Running the periodic task at:', new Date().toISOString());

  try {
    // Fetch all tasks where progress needs to be updated
    const tasks = await db.models.project_task.findAll({
      attributes: ['id', 'name', 'startDate', 'endDate', 'progress', 'parentTaskId'], // Fetch parentTaskId and progress
      where: {
        status: { [Sequelize.Op.ne]: 'Completed' } // Assuming 'completed' is the status for finished tasks
      },
    });

    const currentTime = new Date();

    for (const task of tasks) {
      const { id, startDate, endDate, progress, parentTaskId } = task;

      // Convert startDate and endDate to Date objects for comparison
      const taskStartDate = new Date(startDate);
      const taskEndDate = new Date(endDate);

      // If the task's startDate is in the future, skip it
      if (currentTime < taskStartDate) {
        // Task has not started yet, so progress should remain 0%
        const percentProgress = 0;
        if (progress !== percentProgress) {
          await db.models.project_task.update(
            { progress: percentProgress.toFixed(2) }, // Update progress to 0%
            { where: { id } }
          );
          console.log(`Task ID ${id} : ${startDate} : ${endDate} - Progress updated to 0% (task not started yet)`);
        }
        continue; // Skip further processing for this task
      }

      // If the task has started, calculate the progress
      if (currentTime >= taskStartDate && currentTime <= taskEndDate) {
        // Calculate the total time duration between startDate and endDate in milliseconds
        const totalDuration = taskEndDate - taskStartDate;

        // Calculate the time spent from startDate to now in milliseconds
        const timeSpent = currentTime - taskStartDate;

        // Compute percentage of time spent
        const percentProgress = (timeSpent / totalDuration) * 100;

        // Update the task's progress if necessary
        if (progress !== percentProgress) {
          await db.models.project_task.update(
            { progress: percentProgress.toFixed(2) }, // Update the progress field
            { where: { id } } // Only update the current task
          );

          console.log(`Task ID ${id} : ${startDate} : ${endDate} updated with progress: ${percentProgress.toFixed(2)}%`);
        }
      }

      // If the task has ended (currentTime > taskEndDate), set progress to 100%
      // if (currentTime > taskEndDate && progress !== 100) {
      //   await db.models.project_task.update(
      //     { progress: 100 }, // Set progress to 100% as the task is completed
      //     { where: { id } }
      //   );
      //   console.log(`Task ID ${id} : ${startDate} : ${endDate} - Progress updated to 100% (task completed)`);
      // }

      // If the task has a parent, calculate the average progress of child tasks
      if (parentTaskId) {
        // Get all subtasks for the current parent task
        const subtasks = await db.models.project_task.findAll({
          attributes: ['progress'],
          where: { parentTaskId },
        });

        if (subtasks.length > 0) {
          // Calculate the average progress of subtasks
          const totalProgress = subtasks.reduce((acc, subtask) => acc + parseFloat(subtask.progress), 0);
          const averageProgress = totalProgress / subtasks.length;

          // Update the parent's progress with the average of its children
          await db.models.project_task.update(
            { progress: averageProgress.toFixed(2) }, // Update the progress field with average
            { where: { id: parentTaskId } }
          );
          console.log(`Task ID ${parentTaskId} - Progress updated to average of children: ${averageProgress.toFixed(2)}%`);
        }
      }
    }
  } catch (error) {
    console.error('Error updating task progress:', error);
  }
};




// Set up the periodic task to run every day (600,000 milliseconds)
setInterval(updateStatus, 1*24*3600 * 1000  ); 


async function logEvents(log_object) {
  console.log(log_object)

     /// Log this activity 
     const  instlog = {}
     instlog.table=log_object.model
     instlog.action=log_object.action
     instlog.date = new Date();
     const clientIp = log_object.remoteAddress; // This will give you the remote IP address of the client
     console.log(clientIp);
     instlog.source = clientIp;
 
     // Log the user details 
     instlog.userId = log_object.user_id
     instlog.userName = log_object.user_name
     instlog.status =log_object.status
     console.log(instlog)
 
     // Legacy logs table writes are disabled; auditlogs is the source of truth.
      await logAudit({
        action: log_object.action || 'unknown',
        actorType: 'user',
        actorId: log_object.user_id != null ? String(log_object.user_id) : null,
        actorName: log_object.user_name || null,
        entityType: log_object.model || 'project_task',
        entityId: log_object.entity_id != null ? String(log_object.entity_id) : null,
        resource: log_object.resource || 'POST /api/v1/project/*',
        outcome: /fail/i.test(String(log_object.status || '')) ? 'failure' : 'success',
        statusCode: /fail/i.test(String(log_object.status || '')) ? 500 : 200,
        metadata: {
          source: log_object.remoteAddress || null,
          legacyStatus: log_object.status || null
        }
      })
   // }
 


 
}



exports.modelCreateOneRecord = (req, res) => {
  console.log(req.thisUser.id);
  console.log('creating or updating...',req.body);
  const reg_model = req.body.model;

  /// Create Log Events Object 
  let event = {};
  event.model = reg_model;
  event.remoteAddress = req.connection.remoteAddress;
  event.user_id = req.thisUser.id;
  event.user_name = req.thisUser.username;
  event.table = 'project_task';
  event.action = 'Create or Update ' + reg_model;
  ///////////////////////////////

  let obj = req.body;
  obj.createdBy = req.thisUser.id;

  console.log(obj);

  // Check if ID exists for update or create a new record
  db.models.project_task
    .upsert(obj) // This will create or update depending on whether the primary key (e.g., 'id') exists in 'obj'
    .then(async (result) => {
      const [item, created] = result; // 'created' will be true if a new record was created, false if updated
      
      console.log('item:', item);
      
      // Log the result of the operation
      event.status = created ? 'successful creation' : 'successful update';
      // logEvents(event);
      updateStatus()

      res.status(200).send({
        message: created ? 'Record Created Successfully' : 'Record Updated Successfully',
        total: req.body.count,
        data: item, // Include the created or updated record in the response
        code: '0000',
      });
    })
    .catch(async (error) => {
      // Handle error
      console.log('error0--90----->', error);
      event.status = 'failed';

      // logEvents(event);

      if (error.name === 'SequelizeUniqueConstraintError') {
        console.error('Duplicate entry error:', error.errors.map(e => e.message).join(', '));
        // Handle the duplicate key error (e.g., return a user-friendly message)
        return res.status(400).json({
          message: 'Duplicate records for ' + reg_model + ' not allowed',
        });
      } else {
        // Handle other errors
        console.log('Error creating or updating record:', error);
        return res.status(500).json({
          message: 'An unexpected error occurred while creating or updating the record.',
        });
      }
    });
};


exports.modelDeleteOneRecord = async (req, res) => {

  /// Create Log Events Object 
  const del_event ={}
  del_event.model= req.body.model;
  del_event.remoteAddress= req.connection.remoteAddress
  del_event.user_id= req.thisUser.id
  del_event.user_name= req.thisUser.username
  del_event.action= 'Delete '+ req.body.model
///////////////////////////////


try {
  const modelName = req.body.model;
  const model = db.models[modelName];
  const id = req.body.id;


  


  // Check if the model exists
  if (!model) {
    return res.status(400).send({
      message: `Model '${modelName}' does not exist`,
      code: 'MODEL_NOT_FOUND'
    });
  }

  // Check if the record exists
  const record = await model.findOne({ where: { id } });
  if (!record) {
    return res.status(404).send({
      message: `Record with id '${id}' does not exist in '${modelName}' model`,
      code: 'RECORD_NOT_FOUND'
    });
  }

  


  // Check for dependencies in associated models
  const associations = Object.keys(model.associations);



  console.log('associations',associations)

  for (let i = 0; i < associations.length; i++) {
    const associationName = associations[i];
    const association = model.associations[associationName];

    
    let dependentRowsCount = 0;
    const associationType = association.associationType;
  
    if (associationType === 'HasMany') {
      const mdl = association.target; // Get the associated model's class reference
  
      dependentRowsCount = await mdl.count({
        where: {
          [association.foreignKey]: id
        }
      });
  
      console.log('dependentRowsCount', dependentRowsCount);
    } else {
      dependentRowsCount = 0;
    }
  
    if (dependentRowsCount > 0) {
      return res.status(500).send({
        message: `Cannot delete '${modelName}' record, it has ${dependentRowsCount} dependent ${association.target.name}(s)`,
        code: 'DEPENDENCY_FOUND'
      });
    }
  }

  

  // Delete the record
  await model.destroy({ where: { id } });
  del_event.status='Successful'
  logEvents(del_event)
  updateStatus()

  if (modelName == 'settlement') { 
    deleteSettlementDataFromODK(record)

  }



  res.status(200).send({
    message: 'Delete successful',
    code: '0000'
  });
} catch (err) {
  console.error(err);

  del_event.status='failed'
    logEvents(del_event)

  res.status(500).send({
    message: 'Internal server error',
    code: 'SERVER_ERROR'
  });
}
};


exports.getTasksByProjectId = (req, res) => {
  const projectId = req.body.project_id; // Getting the project ID from the URL params

  console.log('Fetching tasks for project ID:', projectId);

  // Check if the projectId exists
  if (!projectId) {
    return res.status(400).json({
      message: 'Project ID is required',
    });
  }

  // Query the tasks related to the project ID
  db.models.project_task
    .findAll({
      where: { project_id: projectId },
      // You can also specify the attributes you want to select
      attributes: ['id', 'name', 'startDate', 'endDate', 'progress', 'status', 'project_id', 'time_spent', 'parentTaskId'], // Select required fields
      order: [['startDate', 'ASC']], // Optional: Order tasks by startDate
    })
    .then((tasks) => {
      if (tasks.length === 0) {
        return res.status(404).json({
          message: 'No tasks found for this project',
        });
      }

      // Sending back the fetched tasks
      res.status(200).json({
        message: 'Tasks retrieved successfully',
        data: tasks,
        code: '0000',
      });
    })
    .catch((error) => {
      console.error('Error fetching tasks for project:', error);
      return res.status(500).json({
        message: 'An unexpected error occurred while fetching tasks.',
      });
    });
};

exports.xgetNestedTasksByProjectId = (req, res) => {
  const projectId = req.body.project_id; // Getting the project ID from the request body

  console.log('Fetching tasks for project ID:', projectId);

  // Check if the projectId exists
  if (!projectId) {
    return res.status(400).json({
      message: 'Project ID is required',
    });
  }

  // Query the tasks related to the project ID, including subtasks
  db.models.project_task
    .findAll({
      where: { project_id: projectId, parentTaskId: null }, // Fetch only parent tasks
      attributes: ['id', 'name', 'startDate', 'endDate', 'progress', 'status', 'project_id', 'time_spent', 'parentTaskId'], // Select required fields
      order: [['startDate', 'ASC']], // Optional: Order tasks by startDate
      include: [
        {
          model: db.models.project_task, // Include the same model for subtasks
          as: 'Subtasks', // Alias for the relationship
          attributes: ['id', 'name', 'startDate', 'endDate', 'progress', 'status', 'time_spent', 'project_id','parentTaskId'], // Select required fields for subtasks
          order: [['startDate', 'ASC']], // Optional: Order subtasks by startDate
        },
      ],
    })
    .then((tasks) => {
      if (tasks.length === 0) {
        return res.status(404).json({
          message: 'No tasks found for this project',
        });
      }

      // Sending back the fetched tasks with subtasks
      res.status(200).json({
        message: 'Tasks retrieved successfully',
        data: tasks,
        code: '0000',
      });
    })
    .catch((error) => {
      console.error('Error fetching tasks for project:', error);
      return res.status(500).json({
        message: 'An unexpected error occurred while fetching tasks.',
      });
    });
};

exports._getNestedTasksByProjectId = (req, res) => {
  const projectId = req.body.project_id; // Getting the project ID from the request body

  console.log('Fetching tasks for project ID:', projectId);

  // Check if the projectId exists
  if (!projectId) {
    return res.status(400).json({
      message: 'Project ID is required',
    });
  }

  // Recursive function to fetch tasks and subtasks
  const fetchTasksWithSubtasks = async (parentTaskId = null) => {
    try {
      const tasks = await db.models.project_task.findAll({
        where: { project_id: projectId, parentTaskId: parentTaskId }, // Fetch tasks or subtasks based on parentTaskId
        attributes: ['id', 'name', 'startDate', 'endDate', 'progress', 'status', 'project_id', 'time_spent', 'parentTaskId', 'createdAt'], // Select required fields
        order: [['id', 'ASC']], // Order tasks by id in descending order
      });

      // Fetch subtasks for each task
      const tasksWithSubtasks = await Promise.all(
        tasks.map(async (task) => {
          // Recursively fetch subtasks, ordered by id in descending order
          const subtasks = await fetchTasksWithSubtasks(task.id); // Fetch subtasks for the current task
          return {
            ...task.toJSON(),
            Subtasks: subtasks, // Add subtasks to the current task
          };
        })
      );

      return tasksWithSubtasks;
    } catch (error) {
      console.error('Error fetching tasks and subtasks:', error);
      throw error; // Propagate error
    }
  };

  // Fetch the root tasks (tasks with no parent)
  fetchTasksWithSubtasks()
    .then((tasks) => {
      if (tasks.length === 0) {
        return res.status(404).json({
          message: 'No tasks found for this project',
        });
      }

      // Sending back the fetched tasks with subtasks, ordered by id in descending order
      res.status(200).json({
        message: 'Tasks retrieved successfully',
        data: tasks,
        code: '0000',
      });
    })
    .catch((error) => {
      console.error('Error fetching tasks for project:', error);
      return res.status(500).json({
        message: 'An unexpected error occurred while fetching tasks.',
      });
    });
};




exports.getNestedTasksByProjectId = (req, res) => {
  const projectId = req.body.project_id; // Getting the project ID from the request body

  console.log('Fetching tasks for project ID:', projectId);

  // Check if the projectId exists
  if (!projectId) {
    return res.status(400).json({
      message: 'Project ID is required',
    });
  }

  // Recursive function to fetch tasks and subtasks
  const fetchTasksWithSubtasks = async (parentTaskId = null) => {
    try {
      const tasks = await db.models.project_task.findAll({
        where: { project_id: projectId, parentTaskId: parentTaskId }, // Fetch tasks or subtasks based on parentTaskId
        attributes: [
          'id',
          'name',
          'startDate',
          'endDate',
          'progress',
          'status',
          'project_id',
          'time_spent',
          'parentTaskId',
          'createdAt'
        ], // Select required fields
        order: [['id', 'ASC']], // Order tasks by id in ascending order (or use 'DESC' if you prefer reverse)
      });

      // Fetch subtasks for each task
      const tasksWithSubtasks = await Promise.all(
        tasks.map(async (task) => {
          // Recursively fetch subtasks, ordered by id
          const subtasks = await fetchTasksWithSubtasks(task.id); // Fetch subtasks for the current task
          return {
            ...task.toJSON(),
            Subtasks: subtasks, // Add subtasks to the current task
          };
        })
      );

      return tasksWithSubtasks;
    } catch (error) {
      console.error('Error fetching tasks and subtasks:', error);
      throw error; // Propagate error
    }
  };

  // Fetch the root tasks (tasks with no parent)
  fetchTasksWithSubtasks()
    .then((tasks) => {
      if (tasks.length === 0) {
        return res.status(404).json({
          message: 'No tasks found for this project',
        });
      }

      // Sending back the fetched tasks with subtasks
      res.status(200).json({
        message: 'Tasks retrieved successfully',
        data: tasks, // Return tasks with their subtasks
        code: '0000',
      });
    })
    .catch((error) => {
      console.error('Error fetching tasks for project:', error);
      return res.status(500).json({
        message: 'An unexpected error occurred while fetching tasks.',
      });
    });
};


 

 

function sanitizeJson(obj) {
  if (Array.isArray(obj)) {
    return obj.map(sanitizeJson);
  } else if (obj && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [key, sanitizeJson(value)])
    );
  } else if (
    typeof obj === 'undefined' ||
    obj === null ||
    (typeof obj === 'number' && !isFinite(obj)) ||
    Number.isNaN(obj)
  ) {
    return null;
  }
  return obj;
}

exports.modelImportDataUpsert = async (req, res) => {
  const reg_model = req.body.model;
  //const data = req.body.data;

  const data =  sanitizeJson(req.body.data);

  const insertedDocuments = [];
  const errors = [];
  const BATCH_SIZE = 500; // Configurable batch size

  try {
    const currentUserId = req.thisUser.id;

    if (reg_model === 'project_task') {
      const taskMapByCode = {};
      const parentCodes = new Set();

      // Build a quick lookup map and collect parent codes
      data.forEach((item) => {
        if (item.code) taskMapByCode[item.code] = item;
        if (item.parent_task_code) parentCodes.add(item.parent_task_code);
      });

      // Preload existing parent tasks in a single query
      const existingParentTasks = await db.models.project_task.findAll({
        where: { code: Array.from(parentCodes) },
      });

      const parentTasks = {};
      existingParentTasks.forEach((task) => {
        parentTasks[task.code] = task;
      });

      // Create missing parent tasks in batches
      const parentCodesToCreate = Array.from(parentCodes).filter(
        (code) => !parentTasks[code] && taskMapByCode[code]
      );

      for (let i = 0; i < parentCodesToCreate.length; i += BATCH_SIZE) {
        const batch = parentCodesToCreate.slice(i, i + BATCH_SIZE);
        await Promise.all(
          batch.map(async (code) => {
            try {
              const parentData = { ...taskMapByCode[code], createdBy: currentUserId };
              const newParent = await db.models.project_task.create(parentData);
              parentTasks[code] = newParent;
            } catch (err) {
              console.error(`Error creating parent task for code: ${code}`, err);
              errors.push(err.original || err.message);
            }
          })
        );
      }

      // Handle insert/update for all tasks in batches
      for (let i = 0; i < data.length; i += BATCH_SIZE) {
        const batch = data.slice(i, i + BATCH_SIZE);
        await Promise.all(
          batch.map(async (item) => {
            try {
              item.createdBy = currentUserId;

              if (!item.parentTaskId && item.parent_task_code && parentTasks[item.parent_task_code]) {
                item.parentTaskId = parentTasks[item.parent_task_code].id;
              }

              const [inserted, created] = await db.models.project_task.upsert(item, {
                returning: true,
                conflictFields: ['code'], // Ensures upsert behavior
              });

              insertedDocuments.push(inserted);
            } catch (err) {
              console.error('Task upsert error:', err);
              errors.push(err.original || err.message);
            }
          })
        );
      }

    } else {
      // Generic model handling in batches
      for (let i = 0; i < data.length; i += BATCH_SIZE) {
        const batch = data.slice(i, i + BATCH_SIZE);
        await Promise.all(
          batch.map(async (item) => {
            try {
              item.createdBy = currentUserId;

              const [inserted, created] = await db.models[reg_model].upsert(item, {
                returning: true,
              });

              insertedDocuments.push(inserted);
            } catch (err) {
              console.error(`Error in ${reg_model} upsert:`, err);
              errors.push(err.original || err.message);
            }
          })
        );
      }
    }

    // Response handling
    if (errors.length > 0) {
      const errorCodes = [...new Set(errors.map((e) => e?.code || 'UNKNOWN'))];
      const message = errorCodes.includes('42P10')
        ? 'There are one or more duplicate records'
        : `Import/Update failed for ${errors.length} records.`;

      return res.status(500).send({ message, errors });
    }

    // Optional post-processing function
    if (typeof updateStatus === 'function') updateStatus();

    return res.status(200).send({
      message: 'Import/Update Successful',
      code: '0000',
      insertedDocuments,
    });

  } catch (err) {
    console.error('Unexpected error:', err);
    return res.status(500).send({
      message: 'Internal Server Error',
      error: err.message,
    });
  }
};

exports.getProjectDetails = async (req, res) => {
  const { id, code } = req.body;

  console.log('Fetching project details for:', { id, code });

  // Check if either id or code is provided
  if (!id && !code) {
    return res.status(400).json({
      message: 'Project ID or code is required',
    });
  }

  try {
    const whereClause = id ? { id } : { code };

    const project = await db.models.project.findOne({
      where: whereClause,
      attributes: [
        'id', 'title', 'project_code', 'component_id', 'implementation_id',
        'status', 'description', 'start_date', 'end_date', 'cost',
        'sourceFunding', 'contractor_id', 'implementation_scope', 'region', 'code', 'geom'
      ],
      include: [
        {
          model: db.models.project_contractor,
          attributes: ['id', 'name', 'role', 'scope', 'contractor_id', 'project_id'],
          where: { role: 'Consultant' },
          required: false
        }
      ]
    });

    if (!project) {
      return res.status(404).json({
        message: 'Project not found',
      });
    }

    res.status(200).json({
      message: 'Project details retrieved successfully',
      data: project,
      code: '0000',
    });

  } catch (error) {
    console.error('Error fetching project details:', error);
    return res.status(500).json({
      message: 'An unexpected error occurred while fetching project details.',
    });
  }
};

exports.getProjectLocationDetails = async (req, res) => {
  //const { project_id, project_code } = req.body;

 // console.log('Fetching project location details for:', { project_id, project_code });

  // If neither project_id nor project_code is provided, return all project locations

  try {
    const   component_id  = 27;

    const projectWhere = component_id ? { component_id } : undefined;

    console.log('projectWhere', projectWhere);

    const projectLocations = await db.models.project_location.findAll({
      where: {},
      attributes: [
        'project_id','location_name',  'location_type','geom' 
      ],
      include: [
        {
          model: db.models.project,
          attributes: ['id', 'title', 'project_code', 'code', 'status', 'description'],
          where: projectWhere,
          required: !!projectWhere,
          include: [
            {
              model: db.models.project_contractor,
              attributes: ['id', 'name', 'role', 'scope', 'contractor_id', 'project_id'],
              where: { role: 'Consultant' },
              required: false
            }
          ]
        },
        {
          model: db.models.county,
          attributes: ['id', 'name' ],
          required: false
        },
        {
          model: db.models.subcounty,
          attributes: ['id', 'name' ],
          required: false
        },
        {
          model: db.models.ward,
          attributes: ['id', 'name' ],
          required: false
        },
        {
          model: db.models.settlement,
          attributes: ['id', 'name' ],
          required: false
        }
      ]
    });

    if (projectLocations.length === 0) {
      return res.status(404).json({
        message: 'No project locations found',
      });
    }

    // Process the data to include latlng (centroid) computed from ONLY the first geometry
    const processedLocations = projectLocations.map(location => {
      const locationData = location.toJSON();
      
      // Calculate latlng for polygon geometries if geom exists
      if (locationData.geom && locationData.geom.coordinates) {
        try {
          // Use only the first geometry's exterior ring
          if (locationData.geom.type === 'Polygon') {
            const ring = locationData.geom.coordinates[0] || [];
            const n = ring.length;
            if (n > 0) {
              const last = ring[n - 1];
              const first = ring[0];
              const effective = (last && first && last[0] === first[0] && last[1] === first[1]) ? ring.slice(0, n - 1) : ring;
              let sumLat = 0, sumLon = 0;
              effective.forEach(coord => { sumLon += coord[0]; sumLat += coord[1]; });
              const count = effective.length;
              locationData.latlng = count > 0 ? { latitude: sumLat / count, longitude: sumLon / count } : null;
            } else {
              locationData.latlng = null;
            }
          } else if (locationData.geom.type === 'MultiPolygon') {
            const firstPolygon = (locationData.geom.coordinates && locationData.geom.coordinates[0]) || [];
            const ring = (firstPolygon && firstPolygon[0]) || [];
            const n = ring.length;
            if (n > 0) {
              const last = ring[n - 1];
              const first = ring[0];
              const effective = (last && first && last[0] === first[0] && last[1] === first[1]) ? ring.slice(0, n - 1) : ring;
              let sumLat = 0, sumLon = 0;
              effective.forEach(coord => { sumLon += coord[0]; sumLat += coord[1]; });
              const count = effective.length;
              locationData.latlng = count > 0 ? { latitude: sumLat / count, longitude: sumLon / count } : null;
            } else {
              locationData.latlng = null;
            }
          } else if (locationData.geom.type === 'Point') {
            // For point geometries, use coordinates directly
            locationData.latlng = {
              latitude: locationData.geom.coordinates[1],
              longitude: locationData.geom.coordinates[0]
            };
          }
        } catch (error) {
          console.error('Error calculating centroid:', error);
          locationData.latlng = null;
        }
      } else {
        locationData.latlng = null;
      }

      // Remove heavy geometry from response after computing centroid
      if (locationData.geom) {
        delete locationData.geom;
      }

      // Note: Only return centroid for project_location, not for project

      return locationData;
    });

    res.status(200).json({
      message: 'Project location details retrieved successfully',
      data: processedLocations,
      code: '0000',
    });

  } catch (error) {
    console.error('Error fetching project location details:', error);
    return res.status(500).json({
      message: 'An unexpected error occurred while fetching project location details.',
    });
  }
};


// Create or update a project team member
exports.addProjectTeamMember = async (req, res) => {
  try {
    const { id, project_id, name, phone, email, role, code } = req.body;

    if (!project_id || !name || !phone || !role) {
      return res.status(400).json({ message: 'project_id, name, phone, and role are required' });
    }

    const payload = { id, project_id, name, phone, email, role, code };

    // Attach createdBy if available
    if (req.thisUser && req.thisUser.id) {
      payload.createdBy = req.thisUser.id;
    }

    // Use upsert with proper conflict resolution
    // Primary unique index is on ['name', 'phone', 'project_id']
    // This allows same person to be in different projects
    const [item, created] = await db.models.project_team.upsert(payload, {
      returning: true,
      conflictFields: ['name', 'phone', 'project_id']
    });

    return res.status(200).json({
      message: created ? 'Team member created' : 'Team member updated',
      data: item,
      code: '0000',
    });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'Duplicate team member for this project (name/phone combination must be unique per project)' });
    }
    console.error('Error adding project team member:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Clock in a team member to a project
exports.clockInTeamMember = async (req, res) => {
  try {
    const { project_id, team_member_id, geom, project_location_id, notes } = req.body;

    if (!project_id || !team_member_id || !project_location_id) {
      return res.status(400).json({ message: 'project_id,project_location_id  and team_member_id are required' });
    }

    // Check if team member exists and belongs to the project
    const teamMember = await db.models.project_team.findOne({
      where: { id: team_member_id, project_id }
    });

    if (!teamMember) {
      return res.status(404).json({ message: 'Team member not found for this project' });
    }

    // Check if team member is already clocked in
    const activeClockIn = await db.models.project_clockin.findOne({
      where: { 
        team_member_id, 
        project_id, 
        status: 'active' 
      }
    });

    if (activeClockIn) {
      return res.status(400).json({ 
        message: 'Team member is already clocked in',
        data: activeClockIn
      });
    }

    const payload = {
      project_id,
      team_member_id,
      clock_in_time: new Date(),
      work_date: new Date().toISOString().split('T')[0], // Today's date
      geom,
      notes,
      project_location_id,

      status: 'active'
    };

    // Attach createdBy if available
    if (req.thisUser && req.thisUser.id) {
      payload.createdBy = req.thisUser.id;
    }

    const clockIn = await db.models.project_clockin.create(payload);

    return res.status(200).json({
      message: 'Team member clocked in successfully',
      data: clockIn,
      code: '0000',
    });
  } catch (error) {
    console.error('Error clocking in team member:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Clock out a team member from a project
exports.clockOutTeamMember = async (req, res) => {
  try {
    const { project_id, team_member_id,project_location_id, notes } = req.body;

    if (!project_id || !team_member_id || !project_location_id) {
      return res.status(400).json({ message: 'project_id, project_location_id and team_member_id are required' });
    }

    // Find active clock-in session
    const activeClockIn = await db.models.project_clockin.findOne({
      where: { 
        team_member_id, 
        project_id, 
        project_location_id,
        status: 'active' 
      }
    });

    if (!activeClockIn) {
      return res.status(404).json({ message: 'No active clock-in session found for this team member' });
    }

    // Update clock-out time and status
    const clockOutTime = new Date();
    await activeClockIn.update({
      clock_out_time: clockOutTime,
      status: 'completed',
      notes: notes || activeClockIn.notes
    });

    // Refresh the record to get calculated fields
    await activeClockIn.reload();

    return res.status(200).json({
      message: 'Team member clocked out successfully',
      data: activeClockIn,
      code: '0000',
    });
  } catch (error) {
    console.error('Error clocking out team member:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Get clock-in history for a team member or project
exports.getClockInHistory = async (req, res) => {
  try {
    const { project_id, team_member_id, project_location_id, start_date, end_date, status } = req.query;

    const whereClause = {};
    
    if (project_id) whereClause.project_id = project_id;
    if (team_member_id) whereClause.team_member_id = team_member_id;
    if (project_location_id) whereClause.project_location_id = project_location_id;
    if (status) whereClause.status = status;

    // Date range filter
    if (start_date || end_date) {
      whereClause.work_date = {};
      if (start_date) whereClause.work_date[db.Sequelize.Op.gte] = start_date;
      if (end_date) whereClause.work_date[db.Sequelize.Op.lte] = end_date;
    }

    const clockInHistory = await db.models.project_clockin.findAll({
      where: whereClause,
      include: [
        {
          model: db.models.project_team,
          attributes: ['id', 'name', 'phone', 'email', 'role'],
          as: 'teamMember'
        },
        {
          model: db.models.project_location,
          attributes: ['id', 'location_name'],
          as: 'projectLocation'
        },
        {
          model: db.models.project,
          attributes: ['id', 'title', 'project_code'],
          as: 'project'
        }
      ],
      order: [['work_date', 'DESC'], ['clock_in_time', 'DESC']]
    });

    return res.status(200).json({
      message: 'Clock-in history retrieved successfully',
      data: clockInHistory,
      code: '0000',
    });
  } catch (error) {
    console.error('Error fetching clock-in history:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Get current active clock-ins for a project
exports.getActiveClockIns = async (req, res) => {
  try {
    const { project_id } = req.query;

    if (!project_id) {
      return res.status(400).json({ message: 'project_id is required' });
    }

    const activeClockIns = await db.models.project_clockin.findAll({
      where: { 
        project_id, 
        status: 'active' 
      },
      include: [
        {
          model: db.models.project_team,
          attributes: ['id', 'name', 'phone', 'email', 'role'],
          as: 'teamMember'
        },
        {
          model: db.models.project_location,
          attributes: ['id', 'location_name'],
          as: 'projectLocation'
        }
      ],
      order: [['clock_in_time', 'ASC']]
    });

    return res.status(200).json({
      message: 'Active clock-ins retrieved successfully',
      data: activeClockIns,
      code: '0000',
    });
  } catch (error) {
    console.error('Error fetching active clock-ins:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

 