import { Router, Response, NextFunction } from 'express';
import { createNoteSchema } from '../schemas.js';
import { query, run, get } from '../../db/index.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// GET /notes - List user's notes
router.get('/', (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const notes = query(
      'SELECT id, content, created_at FROM notes WHERE user_id = ? ORDER BY created_at DESC',
      [req.userId]
    );
    
    res.json({ notes });
  } catch (error) {
    next(error);
  }
});

// POST /notes - Create new note
router.post('/', (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { content } = createNoteSchema.parse(req.body);
    
    const result = run(
      'INSERT INTO notes (user_id, content) VALUES (?, ?)',
      [req.userId, content]
    );
    
    res.status(201).json({
      message: 'Note created successfully',
      noteId: result.lastInsertRowid
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /notes/:id - Delete note if owned by user
router.delete('/:id', (req: AuthenticatedRequest, res: Response) => {
  try {
    const noteId = parseInt(req.params.id);
    
    if (isNaN(noteId)) {
      return res.status(400).json({ error: 'Invalid note ID' });
    }
    
    // Check if note exists and belongs to user
    const note = get(
      'SELECT id FROM notes WHERE id = ? AND user_id = ?',
      [noteId, req.userId]
    );
    
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }
    
    // Delete the note
    run('DELETE FROM notes WHERE id = ? AND user_id = ?', [noteId, req.userId]);
    
    res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    console.error('Delete note error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;