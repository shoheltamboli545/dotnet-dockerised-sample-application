using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.AspNetCore.Mvc;

namespace SampleApi.Controllers
{
    [ApiController]
    [Route("api")]
    public class SampleController : ControllerBase
    {
        private static readonly object TaskLock = new object();
        private static int nextTaskId = 4;
        private static readonly List<TaskItem> Tasks = new List<TaskItem>
        {
            new TaskItem { Id = 1, Title = "Review EC2 security group", Done = true },
            new TaskItem { Id = 2, Title = "Verify HTTPS UI", Done = false },
            new TaskItem { Id = 3, Title = "Test direct API endpoint", Done = false }
        };

        [HttpGet("health")]
        public IActionResult Health() => Ok(new { status = "ok", timestamp = DateTimeOffset.UtcNow });

        [HttpGet("hello")]
        public IActionResult Hello() => Ok(new { message = "Hello from backend", version = "1.0" });

        [HttpGet("data")]
        public IActionResult Data() => Ok(new List<object>
        {
            new { id = 1, name = "Example item", category = "demo" },
            new { id = 2, name = "Another item", category = "demo" },
            new { id = 3, name = "Last item", category = "demo" }
        });

        [HttpGet("tasks")]
        public IActionResult GetTasks()
        {
            lock (TaskLock) return Ok(Tasks.OrderBy(task => task.Id).ToList());
        }

        [HttpPost("tasks")]
        public IActionResult AddTask([FromBody] CreateTaskRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Title))
                return BadRequest(new { message = "A task title is required." });

            lock (TaskLock)
            {
                var task = new TaskItem { Id = nextTaskId++, Title = request.Title.Trim(), Done = false };
                Tasks.Add(task);
                return CreatedAtAction(nameof(GetTasks), task);
            }
        }

        [HttpDelete("tasks/{id}")]
        public IActionResult DeleteTask(int id)
        {
            lock (TaskLock)
            {
                var task = Tasks.SingleOrDefault(item => item.Id == id);
                if (task == null) return NotFound(new { message = "Task not found." });
                Tasks.Remove(task);
                return NoContent();
            }
        }

        // Deliberately returns an error for demonstrating frontend error handling.
        [HttpPost("tasks/simulate-error")]
        public IActionResult SimulateError() => StatusCode(500, new { message = "Intentional sample API error." });
    }

    public class CreateTaskRequest { public string Title { get; set; } }
    public class TaskItem { public int Id { get; set; } public string Title { get; set; } public bool Done { get; set; } }
}
