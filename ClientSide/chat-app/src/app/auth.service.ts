import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(private http: HttpClient) { }
  //loggin in for login component
  login(email: string, password: string) {
    return this.http.post<{ token: string }>('http://localhost:3000/api/login', { email: email, password: password })
      .pipe(
        map((result: any) => {
          localStorage.setItem('userid', result.userId);
          localStorage.setItem('username', result.username);
          return result;
        })
      );
  }

  //signup for the signup component
  signup(name: string, username: string, email: string, password: string): Observable<boolean> {
    console.log("service")
    return this.http.post('http://localhost:3000/api/signup', { name: name, username: username, email: email, password: password })
      .pipe(
        map(result => {
          console.log("User created successfully");
          return true;
        })
      );
  }

  logout() {
    localStorage.removeItem('userid');
  }

  public get loggedIn(): boolean {
    return (localStorage.getItem('userid') !== null);
  }


}