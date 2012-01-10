from time import time
import os

class Manifest(object):

    def __init__(self, revision, directory):
        # XXX TODO now updates the revision on server restart
        self.revision = revision
        self.directory = directory

    def __call__(self, environ, start_response):
        start_response('200 OK', [('content-type', 'text/cache-manifest')])
        #manifest = "CACHE MANIFEST \n#rev%s\n\n FALLBACK:\n/ index.html\n\n" %(self.revision)
        manifest = "CACHE MANIFEST \n#rev%s\n\n" %(self.revision)

        resources_dir = os.path.join(self.directory, 'resources')
        images_dir = os.path.join(resources_dir, 'images')

        items = []
        items.extend([os.path.join('resources', i) for i in os.listdir(resources_dir)])
        items.extend(os.path.join('resources/images', i) for i in os.listdir(images_dir))
        items.extend([os.path.join('', i) for i in os.listdir(self.directory) if i.endswith('.html') ])

        for i, item in enumerate(items):
            if item.endswith('~'):
                items.pop(i); continue
            if item.endswith('.svn'):
                items.pop(i); continue
            if item.endswith('/images'):
                items.pop(i); continue

        manifest += "\n".join(items)

        return manifest


def app_factory(global_config, **local_conf):
    revision = time() #XXX TODO now updates the revision on server start
    directory = local_conf.get('directory')
    return Manifest(revision, directory)
