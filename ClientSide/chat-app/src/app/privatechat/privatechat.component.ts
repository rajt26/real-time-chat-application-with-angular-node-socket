import { KeyedRead } from '@angular/compiler';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { DataShareService } from '../data-share.service';

import { PrivateChatService } from '../private-chat.service';
import { SocketService } from '../socket.service';

@Component({
  selector: 'app-privatechat',
  templateUrl: './privatechat.component.html',
  styleUrls: ['./privatechat.component.css']
})
export class PrivatechatComponent implements OnInit {
  public userId: string = null;
  public username: string = null;
  public overlayDisplay = true;

  // conversation variables
  public messageLoading = true;
  public selectedUsers = null;
  public messages = [];
  public messageForm: FormGroup;
  @ViewChild('messageThread', { static: false }) private messageContainer: ElementRef;

  // chat list variables
  loading = true;
  selectedUserId: string = null;
  chatListUsers = [];

  constructor(
    private chatService: PrivateChatService,
    private socketService: SocketService,
    private dataShareService: DataShareService,
    private router: Router,
    private fb: FormBuilder,
  ) {
  }


  ngOnInit() {
    this.messageForm = this.fb.group({
      message: ['']
    })
    this.userId = this.dataShareService.getUserId();
    this.username = this.dataShareService.getUserName();
    this.establishSocketConnection();
    this.listenForMessages()
    // conversations
    this.dataShareService.selectedUser.subscribe((selectedUser: any) => {
      if (selectedUser !== null) {
        this.selectedUsers = selectedUser;
        this.getMessages(this.selectedUsers.id)
      }
    });

    // chat list
    this.loading = true;
    this.userId = this.dataShareService.getUserId();
    this.socketService.getChatList(this.userId).subscribe((chatListResponse: any) => {
      this.renderChatList(chatListResponse);
    });
  }
  // chat list starts
  renderChatList(chatListResponse: any): void {
    if (!chatListResponse.error) {
      if (chatListResponse.singleUser) {
        if (this.chatListUsers.length > 0) {
          this.chatListUsers = this.chatListUsers.filter(function (obj: any) {
            return obj.id !== chatListResponse.chatList[0].id;
          });
        }
        /* Adding new online user into chat list array */
        this.chatListUsers = this.chatListUsers.concat(chatListResponse.chatList);
      } else if (chatListResponse.userDisconnected) {
        const loggedOutUser = this.chatListUsers.findIndex((obj: any) => obj.id === chatListResponse.userid);
        if (loggedOutUser >= 0) {
          this.chatListUsers[loggedOutUser].online = 'N';
        }
      } else {
        /* Updating entire chatlist if user logs in. */
        this.chatListUsers = chatListResponse.chatList;
      }
      this.loading = false;
    } else {
      alert(`Unable to load Chat list, Redirecting to Login.`);
      this.chatService.removeLS()
        .then(async (removedLs: boolean) => {
          await this.router.navigate(['/']);
          this.loading = false;
        })
        .catch(async (error: Error) => {
          alert(' This App is Broken, we are working on it. try after some time.');
          await this.router.navigate(['/']);
          console.warn(error);
          this.loading = false;
        });
    }
  }

  isUserSelected(userId: string): boolean {
    if (!this.selectedUserId) {
      return false;
    }
    // this.getMessages(this.selectedUsers.id)
    return this.selectedUserId === userId ? true : false;
  }

  selectedUser(user: any): void {
    this.selectedUserId = user.id;
    this.dataShareService.changeSelectedUser(user);
    // this.getMessages(this.selectedUsers.id)
  }
  // chat list ends

  async establishSocketConnection() {
    try {
      if (this.userId === '' || typeof this.userId === 'undefined' || this.userId === null) {
        this.router.navigate(['/']);
      } else {
        /* making socket connection by passing UserId. */
        this.socketService.connectSocket(this.userId);
        this.overlayDisplay = false;
      }
    } catch (error) {
      alert('Something went wrong');
    }
  }

  logout() {
    this.chatService.removeLS()
      .then((removedLs: boolean) => {
        this.socketService.logout({ userId: this.userId }).subscribe((response: any) => {
          this.router.navigate(['/']);
        });
      })
      .catch((error: Error) => {
        alert(' This App is Broken, we are working on it. try after some time.');
        throw error;
      });
  }

  createLoginForm(): FormGroup {
    return new FormBuilder().group({
      username: [''],
      password: [''],
    });
  }

  createRegistrationForm(): FormGroup {
    return new FormBuilder().group({
      username: [''],
      password: [''],
    });
  }

  createMessageForm(): FormGroup {
    return new FormBuilder().group({
      message: ['']
    });
  }
  // conversation starts
  getMessages(toUserId: string) {
    this.messageLoading = true;
    this.chatService.getMessages({ userId: this.userId, toUserId: toUserId }).subscribe((response: any) => {
      this.messages = response.messages;
      this.messageLoading = false;
    });
  }

  listenForMessages(): void {
    this.socketService.receiveMessages().subscribe((socketResponse: any) => {
      if (this.selectedUsers !== null && this.selectedUsers.id === socketResponse.fromUserId) {
        this.messages = [...this.messages, socketResponse];
        this.scrollMessageContainer();
      }
    });
  }

  sendMessage(event) {
    if (event.keyCode === 13) {
      const message = this.messageForm.controls['message'].value.trim();
      if (message === '' || message === undefined || message === null) {
        alert(`Message can't be empty.`);
      } else if (this.userId === '') {
        this.router.navigate(['/']);
      } else if (this.selectedUsers.id === '') {
        alert(`Select a user to chat.`);
      } else {
        this.sendAndUpdateMessages({
          fromUserId: this.userId,
          message: (message).trim(),
          toUserId: this.selectedUsers.id,
        });
      }
    }
  }

  sendAndUpdateMessages(message: any) {
    try {
      this.messageForm.disable();
      this.socketService.sendMessage(message);
      this.messages = [...this.messages, message];
      this.messageForm.reset();
      this.messageForm.enable();
      this.getMessages(this.selectedUsers.id)
      this.scrollMessageContainer();
    } catch (error) {
      console.warn(error);
      alert(`Can't send your message`);
    }
  }

  scrollMessageContainer(): void {
    if (this.messageContainer !== undefined) {
      try {
        setTimeout(() => {
          this.messageContainer.nativeElement.scrollTop = this.messageContainer.nativeElement.scrollHeight;
        }, 100);
      } catch (error) {
        console.warn(error);
      }
    }
  }

  alignMessage(userId: string): boolean {
    return this.userId === userId ? false : true;
  }
  // conversation ends
}
