import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: process.env.CLIENT_URL || '*',
    credentials: true,
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(EventsGateway.name);

  handleConnection(client: Socket) {
    this.logger.debug(`Socket connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Socket disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinUser')
  handleJoinUser(@ConnectedSocket() client: Socket, @MessageBody() userId: string) {
    if (userId) {
      client.join(`user:${userId}`);
    }
    return { joined: `user:${userId}` };
  }

  @SubscribeMessage('joinWorkspace')
  handleJoinWorkspace(@ConnectedSocket() client: Socket, @MessageBody() workspaceId: string) {
    if (workspaceId) {
      client.join(`workspace:${workspaceId}`);
    }
    return { joined: `workspace:${workspaceId}` };
  }

  @SubscribeMessage('leaveWorkspace')
  handleLeaveWorkspace(@ConnectedSocket() client: Socket, @MessageBody() workspaceId: string) {
    if (workspaceId) {
      client.leave(`workspace:${workspaceId}`);
    }
  }

  @SubscribeMessage('joinProject')
  handleJoinProject(@ConnectedSocket() client: Socket, @MessageBody() projectId: string) {
    if (projectId) {
      client.join(`project:${projectId}`);
    }
    return { joined: `project:${projectId}` };
  }

  @SubscribeMessage('leaveProject')
  handleLeaveProject(@ConnectedSocket() client: Socket, @MessageBody() projectId: string) {
    if (projectId) {
      client.leave(`project:${projectId}`);
    }
  }

  emitToProject(projectId: string, event: string, payload: unknown) {
    this.server?.to(`project:${projectId}`).emit(event, payload);
  }

  emitToWorkspace(workspaceId: string, event: string, payload: unknown) {
    this.server?.to(`workspace:${workspaceId}`).emit(event, payload);
  }

  emitToUser(userId: string, event: string, payload: unknown) {
    this.server?.to(`user:${userId}`).emit(event, payload);
  }
}
