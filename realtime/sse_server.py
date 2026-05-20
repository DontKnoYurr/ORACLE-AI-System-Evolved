
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
import asyncio

app = FastAPI()
subscribers = []

async def event_generator():
    queue = asyncio.Queue()
    subscribers.append(queue)
    try:
        while True:
            data = await queue.get()
            yield f"data: {data}\n\n"
    except asyncio.CancelledError:
        subscribers.remove(queue)

@app.get("/events")
async def sse_endpoint():
    return StreamingResponse(event_generator(), media_type="text/event-stream")

async def push_event(message: str):
    for q in subscribers:
        await q.put(message)
