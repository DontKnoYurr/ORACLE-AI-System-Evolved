
pending_memories = []

def propose_memory(entry):
    pending_memories.append(entry)

def approve_memory(index):
    return pending_memories.pop(index)
