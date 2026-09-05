from django.urls import path
from . import views

urlpatterns = [
    path("admin/", views.developer_board),
    path("people/", views.people),
    path("login/", views.login),
    path("logout/", views.logout),
    path("board/", views.board_view),
]
