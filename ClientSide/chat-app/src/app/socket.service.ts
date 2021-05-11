import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import * as io from 'socket.io-client';

import { environment } from '../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class SocketService {

  private BASE_URL = environment.socketUrl;
  private socket = io.connect(this.BASE_URL);

  constructor() { }

  /*
  * Method to connect the users to socket
  */
  connectSocket(userId: string): void {
    this.socket = io(this.BASE_URL, { query: `userId=${userId}` });
    // console.log('this.socket---->', this.socket);
  }

  /*
* Method to emit the logout event.
*/
  logout(userId: { userId: string }): Observable<any> {
    this.socket.emit('logout', userId);
    return new Observable(observer => {
      this.socket.on('logout-response', (data: any) => {
        observer.next(data);
      });
      return () => {
        this.socket.disconnect();
      };
    });
  }

  /*
* Method to receive chat-list-response event.
*/
  getChatList(userId: string = null): Observable<any> {
    if (userId !== null) {
      this.socket.emit('chat-list', { userId: userId });
    }
    return new Observable(observer => {
      this.socket.on('chat-list-response', (data: any) => {
        observer.next(data);
      });
      return () => {
        this.socket.disconnect();
      };
    });
  }

  /*
* Method to emit the add-messages event.
*/
  sendMessage(message: any): void {
    this.socket.emit('add-message', message);
  }

  /*
* Method to receive add-message-data event.
*/
  receiveMessages(): Observable<any> {
    return new Observable(observer => {
      this.socket.on('add-message-data', (data: any) => {
        observer.next(data);
      });
      return () => {
        this.socket.disconnect();
      };
    });
  }
}
