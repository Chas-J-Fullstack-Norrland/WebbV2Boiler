
import { getPosts, updatePost } from './api/posts';
import { getComments, updateComment, removeComment } from './api/comments';
import type { Comment,Post } from './types';



export async function initAdminPage() {
  const container = document.getElementById('admin-checklists');
  if (!container) return;

  try {
    const [posts, comments] = await Promise.all([
      getPosts(),
      getComments()
    ]);

    if (posts.length === 0) {
      container.innerHTML = '<p class="text-slate-500">Inga inlägg ännu.</p>';
      return;
    }

    container.innerHTML = '';

    posts.forEach(post => {
      const postComments = comments.filter(c => c.postid === post.id);
      const isPublished = post.published ?? true;

      const section = document.createElement('article');
      section.className = 'mb-8 bg-white rounded-xl shadow-sm border border-slate-200 p-6';

      const dateStr = new Date(post.date).toLocaleDateString('sv-SE', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });

      section.innerHTML = `
        <div class="flex items-center justify-between mb-3">
          <div>
            <h2 class="text-lg font-bold text-slate-900">${post.title}</h2>
            <p class="text-xs text-slate-500">
              Av ${post.author} • ${dateStr}
            </p>
          </div>
          <div class="text-right">
            <p class="text-xs mb-1">
              Status:
              <span data-published-status
                    class="${isPublished ? 'text-green-600' : 'text-red-600'} font-semibold">
                ${isPublished ? 'Publicerad' : 'Avpublicerad'}
              </span>
            </p>
            <button class="toggle-publish-btn text-xs px-3 py-1 rounded border
                           ${isPublished ? 'border-red-500 text-red-600' : 'border-green-500 text-green-600'}">
              ${isPublished ? 'Avpublicera' : 'Publicera'}
            </button>
          </div>
        </div>
        <div class="mt-4 border-t border-slate-100 pt-4">
          <h3 class="text-sm font-semibold text-slate-800 mb-2">
            Kommentarer (${postComments.length})
          </h3>
          <div class="space-y-2" data-comments-container></div>
        </div>
      `;

      const commentsContainer = section.querySelector('[data-comments-container]') as HTMLElement | null;

      if (commentsContainer) {
        postComments.forEach(comment => {
          const isApproved = comment.approved ?? false;

          const commentDiv = document.createElement('div');
          commentDiv.className =
            'flex items-start justify-between bg-slate-50 border border-slate-100 rounded-lg p-3 text-sm';

          commentDiv.innerHTML = `
            <div class="mr-3">
              <p class="font-medium text-slate-900">${comment.author}</p>
              <p class="text-slate-700 break-words">${comment.text}</p>
            </div>
            <div class="flex flex-col items-end space-y-1">
              <span data-approved-status
                    class="text-xs ${isApproved ? 'text-green-600' : 'text-slate-500'}">
                ${isApproved ? 'OK' : 'Ej godkänd'}
              </span>
              <button class="toggle-approve-btn text-xs px-2 py-1 rounded border
                             ${isApproved ? 'border-red-500 text-red-600' : 'border-green-500 text-green-600'}">
                ${isApproved ? 'Ta bort OK' : 'Markera OK'}
              </button>
              <button class="delete-comment-btn text-xs text-red-600 hover:text-red-700">
                Radera
              </button>
            </div>
          `;

          const approveBtn = commentDiv.querySelector('.toggle-approve-btn') as HTMLButtonElement | null;
          const approvedStatus = commentDiv.querySelector('[data-approved-status]') as HTMLElement | null;
          const deleteBtn = commentDiv.querySelector('.delete-comment-btn') as HTMLButtonElement | null;

          approveBtn?.addEventListener('click', async () => {
            const newApproved = !(comment.approved ?? false);
            const updated: Comment = { ...comment, approved: newApproved };

            await updateComment(updated);
            comment.approved = newApproved;

            if (approvedStatus) {
              approvedStatus.textContent = newApproved ? 'OK' : 'Ej godkänd';
              approvedStatus.className =
                'text-xs ' + (newApproved ? 'text-green-600' : 'text-slate-500');
            }

            if (approveBtn) {
              approveBtn.textContent = newApproved ? 'Ta bort OK' : 'Markera OK';
              approveBtn.className =
                'toggle-approve-btn text-xs px-2 py-1 rounded border ' +
                (newApproved ? 'border-red-500 text-red-600' : 'border-green-500 text-green-600');
            }
          });

          deleteBtn?.addEventListener('click', async () => {
            await removeComment(comment.id);
            commentDiv.remove();
          });

          commentsContainer.appendChild(commentDiv);
        });
      }

      const publishBtn = section.querySelector('.toggle-publish-btn') as HTMLButtonElement | null;
      const publishedStatus = section.querySelector('[data-published-status]') as HTMLElement | null;

      publishBtn?.addEventListener('click', async () => {
        const newPublished = !(post.published ?? true);
        const updated: Post = { ...post, published: newPublished };

        await updatePost(updated);
        post.published = newPublished;

        if (publishedStatus) {
          publishedStatus.textContent = newPublished ? 'Publicerad' : 'Avpublicerad';
          publishedStatus.className =
            'text-xs ' + (newPublished ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold');
        }

        if (publishBtn) {
          publishBtn.textContent = newPublished ? 'Avpublicera' : 'Publicera';
          publishBtn.className =
            'toggle-publish-btn text-xs px-3 py-1 rounded border ' +
            (newPublished ? 'border-red-500 text-red-600' : 'border-green-500 text-green-600');
        }
      });

      container.appendChild(section);
    });
  } catch (err) {
    console.error(err);
    container.innerHTML = '<p class="text-red-600">Kunde inte ladda admin-data.</p>';
  }
}