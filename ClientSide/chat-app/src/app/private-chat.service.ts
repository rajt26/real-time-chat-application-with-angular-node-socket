import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';

import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PrivateChatService {

  private BASE_URL = environment.apiUrl;
  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
    })
  };

  constructor(
    private http: HttpClient,
    public router: Router
  ) { }

  getUserId(): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        resolve(localStorage.getItem('userid'));
      } catch (error) {
        reject(error);
      }
    });
  }

  removeLS(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        localStorage.removeItem('userid');
        localStorage.removeItem('username');
        resolve(true);
      } catch (error) {
        reject(error);
      }
    });
  }

  usernameAvailable(params: String): Observable<any> {
    return this.http.post(`${this.BASE_URL}usernameAvailable`, JSON.stringify({ username: params }), this.httpOptions).pipe(
      map(
        (response: any) => {
          return response;
        },
        (error) => {
          throw error;
        }
      )
    );
  }

  login(params: any): Observable<any> {
    return this.http.post(`${this.BASE_URL}login`, JSON.stringify(params), this.httpOptions).pipe(
      map(
        (response: any) => {
          return response;
        },
        (error) => {
          throw error;
        }
      )
    );
  }

  register(params: any): Observable<any> {
    return this.http.post(`${this.BASE_URL}register`, JSON.stringify(params), this.httpOptions).pipe(
      map(
        (response: any) => {
          return response;
        },
        (error) => {
          throw error;
        }
      )
    );
  }

  userSessionCheck(): Observable<boolean> {
    const userId = localStorage.getItem('userid');
    return new Observable(observer => {
      if (userId !== null && userId !== undefined) {
        this.http.post(`${this.BASE_URL}userSessionCheck`, JSON.stringify({ userId: userId }), this.httpOptions)
          .subscribe(
            (response: any) => {
              if (response.error) {
                this.router.navigate(['/']);
                return false;
              }
              localStorage.setItem('username', response.username);
              observer.next(true);
            }, (error) => {
              this.router.navigate(['/']);
              observer.next(false);
            });
      } else {
        this.router.navigate(['/']);
        observer.next(false);
      }
    });
  }

  getMessages(params: any): Observable<any> {
    return this.http.post(`${this.BASE_URL}api/getMessages`, JSON.stringify(params), this.httpOptions).pipe(
      map(
        (response: any) => {
          return response;
        },
        (error) => {
          throw error;
        }
      )
    );
  }
}
