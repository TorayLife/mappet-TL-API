# TL-Tasks

### Current version: 0.0.2

### Description:

A very useful library that allows you to execute scripts in a separate thread, execute the script with a delay, and use the result after execution.
Made by [Dyamo](https://github.com/dyam0)

### Dependencies:
This script does not require any other scripts to work.

### Install:

Create `TL-Tasks` script on mappet dashboard.

[Copy this code](https://raw.githubusercontent.com/TorayLife/mappet-TL-API/master/TL-Tasks/TL-Tasks.js) to your `TL-Tasks` script.

Done!

### How to use:

Here is pretty simple video about how to use this library.

[![TL-Tasks usage example](https://img.youtube.com/vi/FuzdFSwhnsg/0.jpg)](https://youtu.be/FuzdFSwhnsg)

example code:

```js
function main(c)
{
    // Code...
    var s = c.getSubject();

    c.send('starting');
    Task.define(function(){
        c.send(1);
    }, 1000).then(function(task){
        c.send(2);
        task.cancel(); //will cancel next task
        return 1000 - 7;
    }, 1000).then(function(task){
        c.send(task.result); //never been called
    },1000);
    c.send('ending');
}
```

### Syntax:

> ###`Task.define(fn(), delay)`
> 
> ---
> - **fn** - The function the task will perform.
>
> - **delay** - Delay in milliseconds.



> ###`.then(fn([task={result}]), delay)`
>
> ---
> - **fn** - The function the task will perform.
>
> - **task (optional)** - current task.
> 
> - **task.result** - result of previous task.
> 
> - **delay** - Delay in milliseconds.

