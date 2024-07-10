document.addEventListener("DOMContentLoaded", () => {
  const taskForm = document.getElementById("task-form");
  const taskList = document.getElementById("task-list");
  const robotForm = document.getElementById("robot-form");
  const robotListFree = document.getElementById("robot-list-free");
  const robotListBusy = document.getElementById("robot-list-busy");

  

  const API_URL = "http://localhost:5000";

  // Функция която проверява статуса на сървъра
  function checkServerStatus() {
    fetch(`${API_URL}/status`)
      .then((response) => response.json())
      .then((data) => {
        if (data.status === "alive") {
          statusCircle.style.fill = "#00FF00"; // Светва в зелено ако е alive
        } else {
          statusCircle.style.fill = "#FF0000"; // Светва в червено ако е not alive
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        statusCircle.style.fill = "#FF0000"; // Светва в червено и за грешка
      });
  }

  // Пъвоначална проверка на статуса на сървъра
  checkServerStatus();

  // Проверява състоянието в интервал от 5сек
  setInterval(checkServerStatus, 5000);

  // Зареждане на задачите при зареждане на страницата
  fetch(`${API_URL}/get_tasks`)
    .then((response) => response.json())
    .then((data) => {
      data.tasks.forEach((task) => {
        addTaskToDOM(task);
      });
    });

  // Зареждане на роботите при зареждане на страницата
  fetch(`${API_URL}/get_robots`)
    .then((response) => response.json())
    .then((data) => {
      data.robots.forEach((robot) => {
        if (robot.status === "free") {
          addRobotToDOM(robot, robotListFree);
        } else if (robot.status === "busy") {
          addRobotToDOM(robot, robotListBusy);
        }
      });
    });

  // Добавяне на нова задача
  taskForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const location = document.getElementById("location").value;
    const action = document.getElementById("action").value;

    fetch(`${API_URL}/add_task`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ location, action }),
    })
      .then((response) => response.json())
      .then((data) => {
        addTaskToDOM(data.task);
        taskForm.reset();
      });
  });

  // Добавяне на нов робот
  robotForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("robot-name").value;

    fetch(`${API_URL}/add_robot`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name }),
    })
      .then((response) => response.json())
      .then((data) => {
        addRobotToDOM(data.robot, robotListFree);
        robotForm.reset();
      });
  });

  // Добавяне на задача в DOM
  function addTaskToDOM(task) {
    const li = document.createElement("li");
    li.textContent = `${task.location} - ${task.action}`;
    const completeBtn = document.createElement("button");
    completeBtn.textContent = "Завърши";
    completeBtn.classList.add("complete-btn");
    completeBtn.addEventListener("click", () => {
      fetch(`${API_URL}/complete_task`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ task_id: task.id }),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.message === "Task completed") {
            li.remove();
            // Освобождаване на робота, който изпълнява задачата
            const robotId = task.robot_id;
            if (robotId) {
              freeRobot(robotId);
            }
          }
        });
    });
    li.appendChild(completeBtn);
    taskList.appendChild(li);
  }

  // Добавяне на робот в DOM
  function addRobotToDOM(robot, listElement) {
    const li = document.createElement("li");
    li.textContent = robot.name;
    if (robot.status === "free") {
      const assignBtn = document.createElement("button");
      assignBtn.textContent = "Назначи задача";
      assignBtn.classList.add("assign-btn");
      assignBtn.addEventListener("click", () => {
        const taskId = prompt("Въведете ID на задачата за назначаване:");
        if (taskId) {
          fetch(`${API_URL}/assign_task`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              robot_id: robot.id,
              task_id: parseInt(taskId),
            }),
          })
            .then((response) => response.json())
            .then((data) => {
              if (data.message === "Task assigned") {
                li.remove();
                addRobotToDOM({ ...robot, status: "busy" }, robotListBusy);
              }
            });
        }
      });
      li.appendChild(assignBtn);
    }
    listElement.appendChild(li);
  }

  // Освобождаване на робот и преместване в списъка със свободни роботи
  function freeRobot(robotId) {
    fetch(`${API_URL}/get_robots`)
      .then((response) => response.json())
      .then((data) => {
        const robot = data.robots.find((r) => r.id === robotId);
        if (robot) {
          const busyRobotLi = Array.from(robotListBusy.children).find((li) =>
            li.textContent.includes(robot.name)
          );
          if (busyRobotLi) {
            busyRobotLi.remove();
            addRobotToDOM({ ...robot, status: "free" }, robotListFree);
          }
        }
      });
  }
});
