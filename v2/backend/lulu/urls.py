from django.urls import path
from . import views

urlpatterns = [
    path("people/", views.people),
    path("login/", views.login),
    path("logout/", views.logout),
    path("board/", views.board_view),
]
