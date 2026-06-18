// Side-effect import — causes TypeScript to apply the global Express.Multer
// augmentation declared in @types/multer (which is a module file, so its
// global declarations are only loaded when the module is explicitly referenced).
import 'multer';
