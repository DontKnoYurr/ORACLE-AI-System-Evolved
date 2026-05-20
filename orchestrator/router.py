
def route_task(task_type: str):
    if task_type == "code":
        return "code_agent"
    if task_type == "training":
        return "training_agent"
    return "general_agent"
