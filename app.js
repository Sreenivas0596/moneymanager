const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const format = require("date-fns/format");
const isMatch = require("date-fns/isMatch");
const isValid = require("date-fns/isValid");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(6000, () => {
      console.log("Server Running at http://localhost:6000/");
    });
  } catch (e) {
    console.log(`DB error: ${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

//api 1

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasCategoryAndPriority = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};

const hasCategoryAndStatus = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};

const hasCategoryProperty = (requestQuery) => {
  return requestQuery.category !== undefined;
};

const hasSearchProperty = (requestQuery) => {
  return requestQuery.search_q !== undefined;
};

const todoArray = (todoItem) => {
  return {
    id: todoItem.id,
    todo: todoItem.todo,
    priority: todoItem.priority,
    category: todoItem.category,
    status: todoItem.status,
    dueDate: todoItem.due_date,
  };
};

//TODOS Based on status, priority, category and search

app.get("/todos/", async (request, response) => {
  const { search_q = "", priority, status, category } = request.query;

  switch (true) {
    //scenario 1

    case hasStatusProperty(request.query):
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        const statusQuery = `
        SELECT 
            * 
        FROM 
            todo 
        WHERE 
            status = '${status}';`;
        const allStatusTodoQuery = await db.all(statusQuery);
        response.send(
          allStatusTodoQuery.map((todoItem) => todoArray(todoItem))
        );
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;

    //scenario 2

    case hasPriorityProperty(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        const priorityQuery = `

      SELECT 
        * 
      FROM 
        todo 
      WHERE 
        priority = '${priority}';`;
        const allPriorityQuery = await db.all(priorityQuery);
        response.send(allPriorityQuery.map((todoItem) => todoArray(todoItem)));
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    //scenario 3

    case hasPriorityAndStatusProperties(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          const priorityAndStatusQuery = `
      SELECT
       * 
      FROM 
        todo  
      WHERE 
        status = '${status}' AND priority = '${priority}';`;
          const allPriorityAndStatusQuery = await db.all(
            priorityAndStatusQuery
          );
          response.send(
            allPriorityAndStatusQuery.map((todoItem) => todoArray(todoItem))
          );
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }

      break;

    //scenario 4
    case hasSearchProperty(request.query):
      const searchQuery = `
      SELECT
       * 
      FROM
        todo 
      WHERE 
        todo like '%${search_q}%';`;
      const allSearchQuery = await db.all(searchQuery);
      response.send(allSearchQuery.map((todoItem) => todoArray(todoItem)));
      break;

    //scenario 5

    case hasCategoryAndStatus(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          const categoryAndStatusQuery = `
          SELECT 
            * 
          FROM
            todo 
          WHERE 
            category='${category}' and status='${status}';`;
          const allCategoryAndStatusQuery = await db.all(
            categoryAndStatusQuery
          );
          response.send(
            allCategoryAndStatusQuery.map((todoItem) => todoArray(todoItem))
          );
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }

      break;

    //scenario 6

    case hasCategoryProperty(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        const categoryQuery = `
        SELECT
            * 
        FROM
            todo 
        WHERE 
            category='${category}';`;
        const allCategoryQuery = await db.all(categoryQuery);
        response.send(allCategoryQuery.map((todoItem) => todoArray(todoItem)));
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    //scenario 7

    case hasCategoryAndPriority(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          priority === "HIGH" ||
          priority === "MEDIUM" ||
          priority === "LOW"
        ) {
          const categoryAndPriorityQuery = `
          SELECT
           * 
         FROM 
            todo 
         WHERE
            category='${category}' and priority='${priority}';`;
          const allCategoryAndPriorityQuery = await db.all(
            categoryAndPriorityQuery
          );
          response.send(
            allCategoryAndPriorityQuery.map((todoItem) => todoArray(todoItem))
          );
        } else {
          response.status(400);
          response.send("Invalid Todo Priority");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }

      break;

    default:
      const defaultQuery = `
      SELECT
         * 
      FROM 
        todo;`;
      const allDefaultTodoQuery = await db.all(defaultQuery);
      response.send(allDefaultTodoQuery.map((todoItem) => todoArray(todoItem)));
  }
});

//todos based on ID

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const todoIdQuery = `
  SELECT 
     * 
  FROM 
     todo 
  WHERE
     id=${todoId};`;
  const responseId = await db.get(todoIdQuery);
  response.send(todoArray(responseId));
});

//todos on dates

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;

  if (isMatch(date, "yyyy-MM-dd")) {
    const newDate = format(new Date(date), "yyyy-MM-dd");

    const todoDateQuery = `
    SELECT
        * 
    FROM 
        todo 
    WHERE 
        due_date='${newDate}';`;
    const responseDate = await db.all(todoDateQuery);

    response.send(responseDate.map((todoItem) => todoArray(todoItem)));
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

//Add todo

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  if (priority === "HIGH" || priority === "LOW" || priority === "MEDIUM") {
    if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (isMatch(dueDate, "yyyy-MM-dd")) {
          const postNewDueDate = format(new Date(dueDate), "yyyy-MM-dd");
          const addTodoQuery = `
  INSERT INTO
    todo (id, todo, category,priority, status, due_date)
  VALUES
    (${id}, 
    '${todo}', 
    '${category}',
    '${priority}', 
    '${status}', 
    '${postNewDueDate}');`;
          await db.run(addTodoQuery);

          response.send("Todo Successfully Added");
        } else {
          response.status(400);
          response.send("Invalid Due Date");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else {
    response.status(400);
    response.send("Invalid Todo Priority");
  }
});

//UPDATE todo
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  const requestBody = request.body;
  const previousTodoQuery = `
  SELECT
      * 
  FROM 
      todo 
      
  WHERE 
    id = ${todoId};`;
  const previousTodo = await db.get(previousTodoQuery);
  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
    category = previousTodo.category,
    dueDate = previousTodo.dueDate,
  } = request.body;

  switch (true) {
    case requestBody.status !== undefined:
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        const updateStatusQuery = `
    UPDATE 
        todo 
    SET 
        todo='${todo}', 
        priority='${priority}', 
        status='${status}', 
        category='${category}',
        due_date='${dueDate}' 
    WHERE 
        id = ${todoId};`;

        await db.run(updateStatusQuery);
        response.send(`Status Updated`);
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;

    case requestBody.priority !== undefined:
      if (priority === "HIGH" || priority === "LOW" || priority === "MEDIUM") {
        const updatePriorityQuery = `
    UPDATE 
        todo 
    SET 
        todo='${todo}', 
        priority='${priority}', 
        status='${status}', 
        category='${category}',
        due_date='${dueDate}' 
     WHERE 
        id = ${todoId};`;

        await db.run(updatePriorityQuery);
        response.send(`Priority Updated`);
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    case requestBody.todo !== undefined:
      const updateTodoQuery = `
    UPDATE 
        todo 
    SET 
        todo='${todo}', 
        priority='${priority}', 
        status='${status}', 
        category='${category}',
        due_date='${dueDate}' 
    WHERE 
        id = ${todoId};`;

      await db.run(updateTodoQuery);
      response.send(`Todo Updated`);
      break;

    case requestBody.category !== undefined:
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        const updateCategoryQuery = `
    UPDATE 
        todo 
    SET 
        todo='${todo}', 
        priority='${priority}', 
        status='${status}', 
        category='${category}',
        due_date='${dueDate}' 
     WHERE 
         id = ${todoId};`;

        await db.run(updateCategoryQuery);
        response.send(`Category Updated`);
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    case requestBody.dueDate !== undefined:
      if (isMatch(dueDate, "yyyy-MM-dd")) {
        const newDueDate = format(new Date(dueDate), "yyyy-MM-dd");
        const updateDateQuery = `
    UPDATE 
        todo 
    SET 
        todo='${todo}', 
        priority='${priority}', 
        status='${status}', 
        category='${category}',
        due_date='${newDueDate}' 
    WHERE 
        id = ${todoId};`;

        await db.run(updateDateQuery);
        response.send(`Due Date Updated`);
      } else {
        response.status(400);
        response.send("Invalid Due Date");
      }
      break;
  }
});
//Delete todo

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
  DELETE FROM
    todo
  WHERE
    id = ${todoId};`;

  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
