# TL-Tasks

### Current version: 0.1.0

### Description:

A very useful library that allows you to execute scripts in a separate thread, execute the script with a delay, and use the result after execution.
Made by [dyamo](https://github.com/dyam0).

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
    Task.run(function(){
        c.send('My first TL-Tasks library task!');
        return 1000;
    }, 1000).thenLooped(function(task){
        c.send(task.result);
        if (task.index == 4) task.break(); // breaks the loop
        return task.result ? task.result - 7 : 1000; // 1000 - 7 - 7 - 7...
    }, 1000, 10).then(function(task){
        c.send(task.result); // result of the last iteration
        task.cancel();
    }, 1000).then(function(task){
        c.send('Never been called');
    }, 1000);
    c.send('ending');
}
```

### Syntax:

> ### `Task.run(fn([task]), delay = 0)`
> 
> ---
> - **fn** - the function the task will perform. 
>   - **task (optional)** - current task.
>     - **task.cancel()** - cancels task chain.
> - **delay** - delay in milliseconds.

> ### `Task.runLooped(fn([task]), delay = 0, count = 1, initDelay = delay)`
>
> ---
> - **fn** - the function the task will perform.
>   - **task (optional)** - current task.
>     - **task.result** - result of the previous iteration.
>     - **task.index** - index of current iteration (starts from 0).
>     - **task.cancel()** - cancels task chain.
>     - **task.break()** - breaks current loop.
> - **delay** - delay between iterations in milliseconds.
> - **count** - iteration count.
> - **initDelay** - delay before starting loop.

---

> ### `.then(fn([task]), delay = 0)`
>
> ---
> - **fn** - The function the task will perform.
>   - **task (optional)** - current task.
>     - **task.result** - result of the previous task.
>     - **task.cancel()** - cancels task chain.
> - **delay** - delay in milliseconds.

> ### `.thenLooped(fn([task]), delay = 0, count = 1, initDelay = delay)`
>
> ---
> - **fn** - The function the task will perform.
>   - **task (optional)** - current task.
>     - **task.result** - result of the previous iteration or task.
>     - **task.index** - index of current iteration (starts from 0).
>     - **task.cancel()** - cancels task chain.
>     - **task.break()** - breaks current loop.
> - **delay** - delay in milliseconds.
> - **count** - iteration count.
> - **initDelay** - delay before starting loop.

