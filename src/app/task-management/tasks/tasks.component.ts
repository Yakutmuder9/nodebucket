/**
 * Title: task.component.ts
 * Author: Professor Krasso
 * Modified by: Yakut Ahmedin
 * Date: 8/16/23
*/

import { Component } from '@angular/core';
import { Employee } from '../employee.interface';
import { Item } from '../item.interface';
import { TaskService } from '../task.service';
import { CookieService } from 'ngx-cookie-service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  CdkDragDrop,
  moveItemInArray,
  transferArrayItem
} from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-tasks',
  templateUrl: './tasks.component.html',
  styleUrls: ['./tasks.component.css']
})
export class TasksComponent {

  // variables
  employee: Employee
  empId: number
  todo: Item[]
  done: Item[]
  errorMessage: string
  successMessage: string

  // form group for new task
  newTaskForm: FormGroup = this.fb.group({
    text: [null, Validators.compose([Validators.required, Validators.minLength(3), Validators.maxLength(50)])],
    category: [null]
  })

  constructor(
    private cookiesService: CookieService,
    private taskService: TaskService,
    private fb: FormBuilder
  ) {

    // Initialize variables
    this.employee = {} as Employee
    this.todo = []
    this.done = []
    this.errorMessage = ''
    this.successMessage = ''

    // Get the employee's ID from cookies
    this.empId = parseInt(this.cookiesService.get("session_user"), 10)

    // Fetch tasks for the employee
    this.taskService.getTask(this.empId).subscribe({
      next: (emp: any) => {
        console.log("emp", emp);
        this.employee = emp
      },
      error: (err) => {
        console.log("error", err);
        this.errorMessage = err.message
        this.hideAlert()
      },
      complete: () => {
        console.log("complete");

        this.todo = this.employee.todo ? this.employee.todo : []
        this.done = this.employee.done ? this.employee.done : []

        console.log("todo", this.todo);
        console.log("done", this.done);
      }
    })
  }

  //  add a new task function
  addTask() {
    const text = this.newTaskForm.controls['text'].value
    const category = this.newTaskForm.controls['category'].value

    if (!category) {
      this.errorMessage = 'Please provide a category'
      this.hideAlert()
      return
    }

    let newTask = this.getTask(text, category)

    this.taskService.addTask(this.empId, newTask).subscribe({
      next: (task: any) => {
        console.log("Task added with id", task.id);

        newTask._id = task.id //set the new task._id the task.id

        this.todo.push(newTask)
        this.newTaskForm.reset()

        this.successMessage = 'Task added successfully'

        this.hideAlert()

      },
      error: (err) => {
        this.errorMessage = err.message
        this.hideAlert()
      }
    })

  }

  // delete a task function
  deleteTask(taskId: string) {
    console.log('Task item: ', taskId);

    if (!confirm('Are you sure you want to detele this task?')

    ) { return }

    this.taskService.deleteTask(this.empId, taskId).subscribe({
      next: (res: any) => {
        console.log('Task deleted wtih Id: ', taskId);

        if (!this.todo) this.todo = []
        if (!this.done) this.done = []

        this.todo = this.todo.filter(t => t._id?.toString() !== taskId)
        this.done = this.done.filter(t => t._id?.toString() !== taskId)

        this.successMessage = 'Task deleted successfully!'
        this.hideAlert()

      },
      error: (err) => {
        console.log('err', err);
        this.errorMessage = err.message
        this.hideAlert()

      }
    })

  }


  // handle task drag and drop
  drop(event: CdkDragDrop<any[]>) {
    console.log("dra");

    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);

      console.log("Moved item in array", event.container.data);

      this.updateTaskList(this.empId, this.todo, this.done)

      // call update api

    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
      console.log("Moved item array", event.container.data);

      this.updateTaskList(this.empId, this.todo, this.done)
      //  call update api

    }
  }

  // update the task list
  updateTaskList(empId: number, todo: Item[], done: Item[]) {
    this.taskService.updateTask(empId, todo, done).subscribe({
      next: (res: any) => {
        console.log("Task update successfuly");
      },
      error: (err) => {
        console.log("err", err);
        this.errorMessage = err.message
        this.hideAlert()
      }
    })
  }

  // hide error and success messages after a delay
  hideAlert() {
    setTimeout(() => {
      this.errorMessage = ''
      this.successMessage = ''
    }, 3000)
  }

  // create a new task with color based on its category
  getTask(text: string, categoryName: string) {
    let task: Item = {} as Item

    const white = "#FFFFFF"
    const green = "#4BCE97"
    const purple = "#9F8FEF"
    const red = "#F87462"


    switch (categoryName) {
      case 'testing':
        task = {
          text: text,
          category: {
            categoryName: categoryName,
            backgroundColor: green
          }
        }
        return task
      case 'meetings':
        task = {
          text: text,
          category: {
            categoryName: categoryName,
            backgroundColor: red
          }
        }
        return task
      case 'projects':
        task = {
          text: text,
          category: {
            categoryName: categoryName,
            backgroundColor: purple
          }
        }
        return task
      default:
        task = {
          text: text,
          category: {
            categoryName: categoryName,
            backgroundColor: white
          }
        }
        return task
    }
  }
}
