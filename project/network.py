class Network(object):
    def __init__(self):
        self.size = 0
        self.directory = []         # List of everyone in the network
        self.parent_to_child = {}   # Adjacency list for parent to child
        self.child_to_parent = {}   # Dict for child to parent

    # Adds a person to the network and forms the parent-child link
    def add_person(self, parent, child):
        self.size += 1
        self.directory.append(parent)
        self.directory.append(child)

        if self.parent_to_child.get(parent) is None:
            self.parent_to_child[parent] = []
        self.parent_to_child[parent].append(child)
        self.child_to_parent[child] = parent

    # Returns a list of all the children of a user, returns None if no children
    def get_children(self, user):
        return self.parent_to_child.get(user)

    # Returns the parent of the user, returns None if no parent
    def get_parent(self, user):
        return self.child_to_parent.get(user)

    # Returns everyone in the network
    def get_all(self):
        return directory

    # Prints all children of a user, else prints none
    def print_children(self, user):
        if self.parent_to_child.get(user) is not None:
            for child in self.parent_to_child.get(user):
                print child.to_string()
        else:
            print "None"

    # Prints the parent of a user, else prints None
    def print_parent(self, user):
        print self.child_to_parent.get(user)

    # Print all users in network, else prints empty message
    def print_all(self):
        if self.directory:
            for user in self.directory:
                print user.to_string()
        else:
            print "Network is empty"