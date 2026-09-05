import { type PageProps } from "../types";
import { Empty } from "../ui";

export default function NotificationsPage({ board, act }: PageProps) {
  return (
    <div className="lulu-panel">
      <div className="lulu-panel-head">
        <h2>Mon fil de notifications</h2>
        <button
          onClick={() => act("read", {}, "Notifications marquées comme lues.")}
        >
          Tout marquer comme lu
        </button>
      </div>
      {board.notifications.length ? (
        <div>
          {[...board.notifications].reverse().map((n) => (
            <article
              className={`lulu-notification ${!n.read ? "unread" : ""}`}
              key={n.id}
            >
              <span>♢</span>
              <div>
                <p>{n.message}</p>
                <small>{new Date(n.createdAt).toLocaleString("fr-FR")}</small>
              </div>
              {!n.read && <span className="lulu-tag">Nouveau</span>}
            </article>
          ))}
        </div>
      ) : (
        <Empty
          title="Aucune notification"
          text="Les rappels et les nouvelles publications apparaîtront ici."
        />
      )}
    </div>
  );
}
